using NLog;
using VaccineControlSystem.Core.Plc;
using VaccineControlSystem.Models;

namespace VaccineControlSystem.Core.Device;

/// <summary>
/// 温度采集器
/// 负责采集6行货道的温度数据（每行2个传感器）
/// </summary>
public class TemperatureCollector : IDisposable
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    
    private readonly IPlcClient _plcClient;
    private readonly System.Timers.Timer _collectTimer;
    
    // 温度传感器配置
    private const int SensorCount = 12; // 6行 × 2个传感器/行
    private const ushort TempRegisterBaseAddress = 0; // 模拟量输入起始地址
    
    // 温度范围 (GSP要求: 2-8℃)
    private const double TempMin = 2.0;
    private const double TempMax = 8.0;
    private const double TempWarnMargin = 0.5; // 预警边界
    
    // 模拟量转换参数 (根据实际PT100配置调整)
    private const double AdMin = 0;
    private const double AdMax = 4095; // 12位AD
    private const double TempRangeMin = -20.0;
    private const double TempRangeMax = 50.0;
    
    // 采集间隔 (毫秒) - GSP要求≤30秒
    private const int CollectInterval = 10000; // 10秒
    
    /// <summary>
    /// 最新温度数据
    /// </summary>
    public TemperatureData[] LatestData { get; private set; } = new TemperatureData[SensorCount];
    
    /// <summary>
    /// 温度数据更新事件
    /// </summary>
    public event EventHandler<TemperatureEventArgs>? TemperatureUpdated;
    
    /// <summary>
    /// 温度报警事件
    /// </summary>
    public event EventHandler<TemperatureAlarmEventArgs>? TemperatureAlarm;

    public TemperatureCollector(IPlcClient plcClient)
    {
        _plcClient = plcClient;
        
        // 初始化温度数据
        for (int i = 0; i < SensorCount; i++)
        {
            LatestData[i] = new TemperatureData
            {
                SensorId = i,
                RowIndex = (char)('A' + i / 2),
                SensorIndex = i % 2,
                Temperature = 0,
                Status = TemperatureStatus.Unknown,
                Timestamp = DateTime.MinValue
            };
        }
        
        // 初始化采集定时器
        _collectTimer = new System.Timers.Timer(CollectInterval);
        _collectTimer.Elapsed += async (s, e) => await CollectAsync();
        _collectTimer.AutoReset = true;
    }

    /// <summary>
    /// 启动温度采集
    /// </summary>
    public void Start()
    {
        Logger.Info("启动温度采集");
        _collectTimer.Start();
        _ = CollectAsync(); // 立即采集一次
    }

    /// <summary>
    /// 停止温度采集
    /// </summary>
    public void Stop()
    {
        Logger.Info("停止温度采集");
        _collectTimer.Stop();
    }

    /// <summary>
    /// 执行一次温度采集
    /// </summary>
    public async Task CollectAsync()
    {
        try
        {
            // 读取所有温度传感器的模拟量值
            var adValues = await _plcClient.ReadInputRegistersAsync(TempRegisterBaseAddress, SensorCount);
            
            var now = DateTime.Now;
            var hasAlarm = false;
            
            for (int i = 0; i < SensorCount; i++)
            {
                // 转换为温度值
                var temperature = ConvertToTemperature(adValues[i]);
                var status = EvaluateTemperatureStatus(temperature);
                
                LatestData[i] = new TemperatureData
                {
                    SensorId = i,
                    RowIndex = (char)('A' + i / 2),
                    SensorIndex = i % 2,
                    Temperature = temperature,
                    Status = status,
                    Timestamp = now
                };
                
                // 检查是否需要报警
                if (status == TemperatureStatus.AlarmHigh || status == TemperatureStatus.AlarmLow)
                {
                    hasAlarm = true;
                    OnTemperatureAlarm(LatestData[i]);
                }
            }
            
            // 触发更新事件
            OnTemperatureUpdated(hasAlarm);
            
            Logger.Debug($"温度采集完成: 平均温度={GetAverageTemperature():F2}℃");
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "温度采集失败");
            
            // 标记所有传感器为故障状态
            var now = DateTime.Now;
            for (int i = 0; i < SensorCount; i++)
            {
                LatestData[i].Status = TemperatureStatus.SensorFault;
                LatestData[i].Timestamp = now;
            }
            
            OnTemperatureAlarm(new TemperatureData
            {
                SensorId = -1,
                Status = TemperatureStatus.SensorFault
            });
        }
    }

    /// <summary>
    /// 将AD值转换为温度
    /// </summary>
    private double ConvertToTemperature(ushort adValue)
    {
        // 线性转换
        var ratio = (adValue - AdMin) / (AdMax - AdMin);
        var temperature = TempRangeMin + ratio * (TempRangeMax - TempRangeMin);
        return Math.Round(temperature, 2);
    }

    /// <summary>
    /// 评估温度状态
    /// </summary>
    private TemperatureStatus EvaluateTemperatureStatus(double temperature)
    {
        if (temperature >= TempMax)
            return TemperatureStatus.AlarmHigh;
        
        if (temperature <= TempMin)
            return TemperatureStatus.AlarmLow;
        
        if (temperature >= TempMax - TempWarnMargin)
            return TemperatureStatus.WarnHigh;
        
        if (temperature <= TempMin + TempWarnMargin)
            return TemperatureStatus.WarnLow;
        
        return TemperatureStatus.Normal;
    }

    /// <summary>
    /// 获取平均温度
    /// </summary>
    public double GetAverageTemperature()
    {
        var validTemps = LatestData
            .Where(t => t.Status != TemperatureStatus.SensorFault && t.Status != TemperatureStatus.Unknown)
            .Select(t => t.Temperature)
            .ToArray();
        
        return validTemps.Length > 0 ? validTemps.Average() : 0;
    }

    /// <summary>
    /// 获取指定行的温度
    /// </summary>
    public double GetRowTemperature(char row)
    {
        var rowIndex = row - 'A';
        var sensor1 = LatestData[rowIndex * 2];
        var sensor2 = LatestData[rowIndex * 2 + 1];
        
        if (sensor1.Status == TemperatureStatus.SensorFault)
            return sensor2.Temperature;
        if (sensor2.Status == TemperatureStatus.SensorFault)
            return sensor1.Temperature;
        
        return (sensor1.Temperature + sensor2.Temperature) / 2;
    }

    /// <summary>
    /// 检查是否有温度报警
    /// </summary>
    public bool HasAlarm()
    {
        return LatestData.Any(t => 
            t.Status == TemperatureStatus.AlarmHigh || 
            t.Status == TemperatureStatus.AlarmLow ||
            t.Status == TemperatureStatus.SensorFault);
    }

    private void OnTemperatureUpdated(bool hasAlarm)
    {
        TemperatureUpdated?.Invoke(this, new TemperatureEventArgs(LatestData.ToArray(), hasAlarm));
    }

    private void OnTemperatureAlarm(TemperatureData data)
    {
        TemperatureAlarm?.Invoke(this, new TemperatureAlarmEventArgs(data));
    }

    public void Dispose()
    {
        _collectTimer.Stop();
        _collectTimer.Dispose();
        GC.SuppressFinalize(this);
    }
}

/// <summary>
/// 温度状态
/// </summary>
public enum TemperatureStatus
{
    Unknown,      // 未知
    Normal,       // 正常 (2.5-7.5℃)
    WarnHigh,     // 高温预警 (7.5-8℃)
    WarnLow,      // 低温预警 (2-2.5℃)
    AlarmHigh,    // 超高温 (≥8℃)
    AlarmLow,     // 超低温 (≤2℃)
    SensorFault   // 传感器故障
}

/// <summary>
/// 温度数据
/// </summary>
public class TemperatureData
{
    public int SensorId { get; set; }
    public char RowIndex { get; set; }
    public int SensorIndex { get; set; }
    public double Temperature { get; set; }
    public TemperatureStatus Status { get; set; }
    public DateTime Timestamp { get; set; }
    
    public string GetPositionName() => $"{RowIndex}区传感器{SensorIndex + 1}";
}

/// <summary>
/// 温度更新事件参数
/// </summary>
public class TemperatureEventArgs : EventArgs
{
    public TemperatureData[] Data { get; }
    public bool HasAlarm { get; }
    
    public TemperatureEventArgs(TemperatureData[] data, bool hasAlarm)
    {
        Data = data;
        HasAlarm = hasAlarm;
    }
}

/// <summary>
/// 温度报警事件参数
/// </summary>
public class TemperatureAlarmEventArgs : EventArgs
{
    public TemperatureData Data { get; }
    
    public TemperatureAlarmEventArgs(TemperatureData data)
    {
        Data = data;
    }
}

