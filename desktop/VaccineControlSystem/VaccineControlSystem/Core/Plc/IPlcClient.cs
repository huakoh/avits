namespace VaccineControlSystem.Core.Plc;

/// <summary>
/// PLC通信客户端接口
/// </summary>
public interface IPlcClient : IDisposable
{
    /// <summary>
    /// 是否已连接
    /// </summary>
    bool IsConnected { get; }
    
    /// <summary>
    /// 连接PLC
    /// </summary>
    /// <param name="ipAddress">IP地址</param>
    /// <param name="port">端口号</param>
    /// <returns>是否连接成功</returns>
    Task<bool> ConnectAsync(string ipAddress, int port);
    
    /// <summary>
    /// 断开连接
    /// </summary>
    void Disconnect();
    
    /// <summary>
    /// 读取线圈状态 (Y输出)
    /// </summary>
    /// <param name="address">起始地址</param>
    /// <param name="count">数量</param>
    /// <returns>状态数组</returns>
    Task<bool[]> ReadCoilsAsync(ushort address, ushort count);
    
    /// <summary>
    /// 读取输入状态 (X输入)
    /// </summary>
    /// <param name="address">起始地址</param>
    /// <param name="count">数量</param>
    /// <returns>状态数组</returns>
    Task<bool[]> ReadInputsAsync(ushort address, ushort count);
    
    /// <summary>
    /// 读取保持寄存器
    /// </summary>
    /// <param name="address">起始地址</param>
    /// <param name="count">数量</param>
    /// <returns>数据数组</returns>
    Task<ushort[]> ReadHoldingRegistersAsync(ushort address, ushort count);
    
    /// <summary>
    /// 读取输入寄存器 (模拟量)
    /// </summary>
    /// <param name="address">起始地址</param>
    /// <param name="count">数量</param>
    /// <returns>数据数组</returns>
    Task<ushort[]> ReadInputRegistersAsync(ushort address, ushort count);
    
    /// <summary>
    /// 写入单个线圈
    /// </summary>
    /// <param name="address">地址</param>
    /// <param name="value">值</param>
    Task WriteSingleCoilAsync(ushort address, bool value);
    
    /// <summary>
    /// 写入多个线圈
    /// </summary>
    /// <param name="address">起始地址</param>
    /// <param name="values">值数组</param>
    Task WriteMultipleCoilsAsync(ushort address, bool[] values);
    
    /// <summary>
    /// 写入单个寄存器
    /// </summary>
    /// <param name="address">地址</param>
    /// <param name="value">值</param>
    Task WriteSingleRegisterAsync(ushort address, ushort value);
    
    /// <summary>
    /// 写入多个寄存器
    /// </summary>
    /// <param name="address">起始地址</param>
    /// <param name="values">值数组</param>
    Task WriteMultipleRegistersAsync(ushort address, ushort[] values);
}

