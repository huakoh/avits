using NLog;
using VaccineControlSystem.Core.Device;
using VaccineControlSystem.Models;

namespace VaccineControlSystem.Services;

/// <summary>
/// 分拣服务
/// 负责疫苗分拣任务的调度和执行
/// </summary>
public class SortingService
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    
    private readonly ChannelController _channelController;
    private readonly ConveyorController _conveyorController;
    private readonly GrpcClientService _grpcClient;
    private readonly TaskQueueService _taskQueue;
    
    private bool _isProcessing;
    private readonly SemaphoreSlim _processLock = new(1, 1);

    /// <summary>
    /// 任务状态变更事件
    /// </summary>
    public event EventHandler<SortingTaskEventArgs>? TaskStatusChanged;

    public SortingService(
        ChannelController channelController,
        ConveyorController conveyorController,
        GrpcClientService grpcClient,
        TaskQueueService taskQueue)
    {
        _channelController = channelController;
        _conveyorController = conveyorController;
        _grpcClient = grpcClient;
        _taskQueue = taskQueue;
    }

    /// <summary>
    /// 启动分拣服务
    /// </summary>
    public void Start()
    {
        Logger.Info("分拣服务启动");
        _isProcessing = true;
        _ = ProcessTaskLoopAsync();
    }

    /// <summary>
    /// 停止分拣服务
    /// </summary>
    public void Stop()
    {
        Logger.Info("分拣服务停止");
        _isProcessing = false;
    }

    /// <summary>
    /// 添加分拣任务
    /// </summary>
    public async Task<bool> AddTaskAsync(SortingTask task)
    {
        try
        {
            // 验证任务
            if (string.IsNullOrEmpty(task.ChannelPosition))
            {
                Logger.Warn($"无效的分拣任务: 货道位置为空");
                return false;
            }
            
            // 添加到队列
            await _taskQueue.EnqueueAsync(task);
            
            Logger.Info($"添加分拣任务: 订单={task.OrderNo}, 货道={task.ChannelPosition}, 疫苗={task.VaccineName}");
            
            OnTaskStatusChanged(task, SortingTaskStatus.Pending);
            
            return true;
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "添加分拣任务失败");
            return false;
        }
    }

    /// <summary>
    /// 取消分拣任务
    /// </summary>
    public async Task<bool> CancelTaskAsync(string taskId)
    {
        try
        {
            var removed = await _taskQueue.RemoveAsync(taskId);
            if (removed)
            {
                Logger.Info($"取消分拣任务: {taskId}");
            }
            return removed;
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"取消分拣任务失败: {taskId}");
            return false;
        }
    }

    /// <summary>
    /// 任务处理循环
    /// </summary>
    private async Task ProcessTaskLoopAsync()
    {
        while (_isProcessing)
        {
            try
            {
                // 获取下一个任务
                var task = await _taskQueue.DequeueAsync();
                if (task == null)
                {
                    await Task.Delay(500);
                    continue;
                }
                
                // 处理任务
                await ProcessTaskAsync(task);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "任务处理循环异常");
                await Task.Delay(1000);
            }
        }
    }

    /// <summary>
    /// 处理单个分拣任务
    /// </summary>
    private async Task ProcessTaskAsync(SortingTask task)
    {
        await _processLock.WaitAsync();
        
        try
        {
            Logger.Info($"开始处理任务: {task.TaskId}, 货道={task.ChannelPosition}");
            
            task.Status = SortingTaskStatus.Processing;
            task.StartTime = DateTime.Now;
            OnTaskStatusChanged(task, SortingTaskStatus.Processing);
            
            // 1. 货道出货
            var dispenseResult = await _channelController.DispenseAsync(task.ChannelPosition);
            if (!dispenseResult.Success)
            {
                task.Status = SortingTaskStatus.Failed;
                task.ErrorMessage = dispenseResult.Message;
                OnTaskStatusChanged(task, SortingTaskStatus.Failed);
                Logger.Warn($"货道出货失败: {dispenseResult.Message}");
                return;
            }
            
            // 2. 启动皮带传输
            await _conveyorController.StartAsync();
            
            // 3. 等待到达视觉识别工位
            await _conveyorController.WaitForVisionPositionAsync();
            
            // 4. 暂停皮带，执行视觉识别
            await _conveyorController.PauseAsync();
            
            var visionResult = await VerifyWithVisionAsync(task.TraceCode);
            if (!visionResult.Success)
            {
                task.Status = SortingTaskStatus.Failed;
                task.ErrorMessage = $"视觉验证失败: {visionResult.Message}";
                OnTaskStatusChanged(task, SortingTaskStatus.Failed);
                Logger.Warn($"视觉验证失败: {visionResult.Message}");
                
                // 报警并等待人工处理
                // TODO: 触发报警
                return;
            }
            
            task.VisionVerified = true;
            task.VisionImagePath = visionResult.ImagePath;
            
            // 5. 继续传输到出库口
            await _conveyorController.ResumeAsync();
            await _conveyorController.WaitForOutputPositionAsync();
            await _conveyorController.StopAsync();
            
            // 6. 完成任务
            task.Status = SortingTaskStatus.Completed;
            task.CompleteTime = DateTime.Now;
            OnTaskStatusChanged(task, SortingTaskStatus.Completed);
            
            // 7. 上报服务端
            await ReportTaskCompletedAsync(task);
            
            Logger.Info($"任务完成: {task.TaskId}, 耗时={(task.CompleteTime - task.StartTime)?.TotalSeconds:F1}秒");
        }
        catch (Exception ex)
        {
            task.Status = SortingTaskStatus.Failed;
            task.ErrorMessage = ex.Message;
            OnTaskStatusChanged(task, SortingTaskStatus.Failed);
            Logger.Error(ex, $"任务处理异常: {task.TaskId}");
        }
        finally
        {
            _processLock.Release();
        }
    }

    /// <summary>
    /// 调用视觉识别服务验证
    /// </summary>
    private async Task<VisionVerifyResult> VerifyWithVisionAsync(string expectedTraceCode)
    {
        try
        {
            // 调用Python视觉识别服务
            var result = await _grpcClient.VerifyVaccineAsync(expectedTraceCode);
            return result;
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "调用视觉识别服务失败");
            return new VisionVerifyResult
            {
                Success = false,
                Message = "视觉识别服务不可用"
            };
        }
    }

    /// <summary>
    /// 上报任务完成
    /// </summary>
    private async Task ReportTaskCompletedAsync(SortingTask task)
    {
        try
        {
            await _grpcClient.ReportTaskCompletedAsync(task);
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "上报任务完成失败，将重试");
            // TODO: 加入重试队列
        }
    }

    private void OnTaskStatusChanged(SortingTask task, SortingTaskStatus status)
    {
        TaskStatusChanged?.Invoke(this, new SortingTaskEventArgs(task, status));
    }
}

/// <summary>
/// 分拣任务
/// </summary>
public class SortingTask
{
    public string TaskId { get; set; } = Guid.NewGuid().ToString("N");
    public int OrderId { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public int VaccineId { get; set; }
    public string VaccineName { get; set; } = string.Empty;
    public string TraceCode { get; set; } = string.Empty;
    public string BatchNo { get; set; } = string.Empty;
    public string ChannelPosition { get; set; } = string.Empty;
    public int Priority { get; set; } = 1;
    public SortingTaskStatus Status { get; set; } = SortingTaskStatus.Pending;
    public DateTime CreateTime { get; set; } = DateTime.Now;
    public DateTime? StartTime { get; set; }
    public DateTime? CompleteTime { get; set; }
    public string? ErrorMessage { get; set; }
    public bool VisionVerified { get; set; }
    public string? VisionImagePath { get; set; }
}

/// <summary>
/// 分拣任务状态
/// </summary>
public enum SortingTaskStatus
{
    Pending,     // 待处理
    Processing,  // 处理中
    Completed,   // 已完成
    Failed,      // 失败
    Cancelled    // 已取消
}

/// <summary>
/// 分拣任务事件参数
/// </summary>
public class SortingTaskEventArgs : EventArgs
{
    public SortingTask Task { get; }
    public SortingTaskStatus Status { get; }
    
    public SortingTaskEventArgs(SortingTask task, SortingTaskStatus status)
    {
        Task = task;
        Status = status;
    }
}

/// <summary>
/// 视觉验证结果
/// </summary>
public class VisionVerifyResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ActualTraceCode { get; set; }
    public double Confidence { get; set; }
    public string? ImagePath { get; set; }
}

