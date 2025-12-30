using NLog;
using VaccineControlSystem.Core.Plc;
using VaccineControlSystem.Models;

namespace VaccineControlSystem.Core.Device;

/// <summary>
/// 货道控制器
/// 负责控制60个货道的出货操作
/// </summary>
public class ChannelController
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    
    private readonly IPlcClient _plcClient;
    
    // 货道配置: 6行(A-F) × 10列(1-10) = 60个货道
    private const int RowCount = 6;
    private const int ColCount = 10;
    private const int TotalChannels = RowCount * ColCount;
    
    // Y输出起始地址 (货道电机控制)
    private const ushort MotorOutputBaseAddress = 0;
    
    // X输入起始地址 (货道到位传感器)
    private const ushort SensorInputBaseAddress = 0;
    
    // 出货超时时间(毫秒)
    private const int DispenseTimeout = 10000;
    
    /// <summary>
    /// 货道状态变更事件
    /// </summary>
    public event EventHandler<ChannelStatusEventArgs>? ChannelStatusChanged;
    
    public ChannelController(IPlcClient plcClient)
    {
        _plcClient = plcClient;
    }

    /// <summary>
    /// 触发指定货道出货
    /// </summary>
    /// <param name="position">货道位置，如 "A1", "B5"</param>
    /// <returns>出货任务</returns>
    public async Task<DispenseResult> DispenseAsync(string position)
    {
        var channelIndex = ParsePosition(position);
        if (channelIndex < 0)
        {
            return new DispenseResult
            {
                Success = false,
                Message = $"无效的货道位置: {position}"
            };
        }
        
        Logger.Info($"开始出货: 货道={position}, 索引={channelIndex}");
        
        try
        {
            // 1. 检查货道传感器状态
            var sensorState = await ReadSensorStateAsync(channelIndex);
            if (!sensorState)
            {
                return new DispenseResult
                {
                    Success = false,
                    Message = $"货道 {position} 无物料"
                };
            }
            
            // 2. 启动电机
            await StartMotorAsync(channelIndex);
            
            // 3. 等待出货完成 (传感器状态变化)
            var completed = await WaitForDispenseCompleteAsync(channelIndex, DispenseTimeout);
            
            // 4. 停止电机
            await StopMotorAsync(channelIndex);
            
            if (completed)
            {
                Logger.Info($"出货成功: 货道={position}");
                OnChannelStatusChanged(position, ChannelStatus.DispenseComplete);
                
                return new DispenseResult
                {
                    Success = true,
                    Message = "出货成功",
                    ChannelPosition = position,
                    DispenseTime = DateTime.Now
                };
            }
            else
            {
                Logger.Warn($"出货超时: 货道={position}");
                OnChannelStatusChanged(position, ChannelStatus.Error);
                
                return new DispenseResult
                {
                    Success = false,
                    Message = "出货超时"
                };
            }
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"出货异常: 货道={position}");
            OnChannelStatusChanged(position, ChannelStatus.Error);
            
            // 确保电机停止
            try { await StopMotorAsync(channelIndex); } catch { }
            
            return new DispenseResult
            {
                Success = false,
                Message = $"出货异常: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// 读取所有货道传感器状态
    /// </summary>
    public async Task<Dictionary<string, bool>> ReadAllSensorStatesAsync()
    {
        var result = new Dictionary<string, bool>();
        
        try
        {
            var states = await _plcClient.ReadInputsAsync(SensorInputBaseAddress, TotalChannels);
            
            for (int row = 0; row < RowCount; row++)
            {
                for (int col = 0; col < ColCount; col++)
                {
                    var position = $"{(char)('A' + row)}{col + 1}";
                    var index = row * ColCount + col;
                    result[position] = states[index];
                }
            }
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "读取货道传感器状态失败");
        }
        
        return result;
    }

    /// <summary>
    /// 读取指定货道传感器状态
    /// </summary>
    private async Task<bool> ReadSensorStateAsync(int channelIndex)
    {
        var address = (ushort)(SensorInputBaseAddress + channelIndex);
        var states = await _plcClient.ReadInputsAsync(address, 1);
        return states[0];
    }

    /// <summary>
    /// 启动货道电机
    /// </summary>
    private async Task StartMotorAsync(int channelIndex)
    {
        var address = (ushort)(MotorOutputBaseAddress + channelIndex);
        await _plcClient.WriteSingleCoilAsync(address, true);
        Logger.Debug($"启动电机: 索引={channelIndex}");
    }

    /// <summary>
    /// 停止货道电机
    /// </summary>
    private async Task StopMotorAsync(int channelIndex)
    {
        var address = (ushort)(MotorOutputBaseAddress + channelIndex);
        await _plcClient.WriteSingleCoilAsync(address, false);
        Logger.Debug($"停止电机: 索引={channelIndex}");
    }

    /// <summary>
    /// 等待出货完成
    /// </summary>
    private async Task<bool> WaitForDispenseCompleteAsync(int channelIndex, int timeout)
    {
        var startTime = DateTime.Now;
        var initialState = await ReadSensorStateAsync(channelIndex);
        
        while ((DateTime.Now - startTime).TotalMilliseconds < timeout)
        {
            await Task.Delay(100); // 每100ms检测一次
            
            var currentState = await ReadSensorStateAsync(channelIndex);
            
            // 当传感器从有物料变为无物料时，表示出货完成
            if (initialState && !currentState)
            {
                return true;
            }
        }
        
        return false;
    }

    /// <summary>
    /// 解析货道位置
    /// </summary>
    /// <param name="position">位置字符串，如 "A1", "B10"</param>
    /// <returns>货道索引，失败返回-1</returns>
    public static int ParsePosition(string position)
    {
        if (string.IsNullOrEmpty(position) || position.Length < 2)
            return -1;
        
        var row = char.ToUpper(position[0]) - 'A';
        if (row < 0 || row >= RowCount)
            return -1;
        
        if (!int.TryParse(position.Substring(1), out var col))
            return -1;
        
        col--; // 转为0索引
        if (col < 0 || col >= ColCount)
            return -1;
        
        return row * ColCount + col;
    }

    /// <summary>
    /// 获取货道位置字符串
    /// </summary>
    public static string GetPosition(int channelIndex)
    {
        var row = channelIndex / ColCount;
        var col = channelIndex % ColCount;
        return $"{(char)('A' + row)}{col + 1}";
    }

    /// <summary>
    /// 触发状态变更事件
    /// </summary>
    private void OnChannelStatusChanged(string position, ChannelStatus status)
    {
        ChannelStatusChanged?.Invoke(this, new ChannelStatusEventArgs(position, status));
    }
}

/// <summary>
/// 货道状态
/// </summary>
public enum ChannelStatus
{
    Idle,           // 空闲
    Dispensing,     // 出货中
    DispenseComplete, // 出货完成
    Error           // 错误
}

/// <summary>
/// 货道状态变更事件参数
/// </summary>
public class ChannelStatusEventArgs : EventArgs
{
    public string Position { get; }
    public ChannelStatus Status { get; }
    
    public ChannelStatusEventArgs(string position, ChannelStatus status)
    {
        Position = position;
        Status = status;
    }
}

/// <summary>
/// 出货结果
/// </summary>
public class DispenseResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ChannelPosition { get; set; }
    public DateTime? DispenseTime { get; set; }
}

