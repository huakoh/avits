using System.Net.Sockets;
using NModbus;
using NLog;

namespace VaccineControlSystem.Core.Plc;

/// <summary>
/// Modbus TCP 通信客户端
/// 用于与信捷PLC通信
/// </summary>
public class ModbusTcpClient : IPlcClient
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    
    private TcpClient? _tcpClient;
    private IModbusMaster? _modbusMaster;
    private readonly object _lockObj = new();
    private readonly byte _slaveId = 1; // 从站地址
    
    public bool IsConnected => _tcpClient?.Connected ?? false;

    /// <summary>
    /// 连接到PLC
    /// </summary>
    public async Task<bool> ConnectAsync(string ipAddress, int port)
    {
        try
        {
            lock (_lockObj)
            {
                Disconnect();
                
                _tcpClient = new TcpClient();
                _tcpClient.ReceiveTimeout = 3000;
                _tcpClient.SendTimeout = 3000;
            }
            
            await _tcpClient.ConnectAsync(ipAddress, port);
            
            var factory = new ModbusFactory();
            _modbusMaster = factory.CreateMaster(_tcpClient);
            _modbusMaster.Transport.ReadTimeout = 3000;
            _modbusMaster.Transport.WriteTimeout = 3000;
            
            Logger.Info($"PLC连接成功: {ipAddress}:{port}");
            return true;
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"PLC连接失败: {ipAddress}:{port}");
            Disconnect();
            return false;
        }
    }

    /// <summary>
    /// 断开连接
    /// </summary>
    public void Disconnect()
    {
        lock (_lockObj)
        {
            try
            {
                _modbusMaster?.Dispose();
                _tcpClient?.Close();
                _tcpClient?.Dispose();
            }
            catch (Exception ex)
            {
                Logger.Warn(ex, "断开PLC连接时发生异常");
            }
            finally
            {
                _modbusMaster = null;
                _tcpClient = null;
            }
        }
    }

    /// <summary>
    /// 读取线圈状态 (Y输出点)
    /// </summary>
    public async Task<bool[]> ReadCoilsAsync(ushort address, ushort count)
    {
        EnsureConnected();
        try
        {
            return await Task.Run(() => _modbusMaster!.ReadCoils(_slaveId, address, count));
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"读取线圈失败: 地址={address}, 数量={count}");
            throw;
        }
    }

    /// <summary>
    /// 读取输入状态 (X输入点)
    /// </summary>
    public async Task<bool[]> ReadInputsAsync(ushort address, ushort count)
    {
        EnsureConnected();
        try
        {
            return await Task.Run(() => _modbusMaster!.ReadInputs(_slaveId, address, count));
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"读取输入失败: 地址={address}, 数量={count}");
            throw;
        }
    }

    /// <summary>
    /// 读取保持寄存器
    /// </summary>
    public async Task<ushort[]> ReadHoldingRegistersAsync(ushort address, ushort count)
    {
        EnsureConnected();
        try
        {
            return await Task.Run(() => _modbusMaster!.ReadHoldingRegisters(_slaveId, address, count));
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"读取保持寄存器失败: 地址={address}, 数量={count}");
            throw;
        }
    }

    /// <summary>
    /// 读取输入寄存器 (模拟量输入)
    /// </summary>
    public async Task<ushort[]> ReadInputRegistersAsync(ushort address, ushort count)
    {
        EnsureConnected();
        try
        {
            return await Task.Run(() => _modbusMaster!.ReadInputRegisters(_slaveId, address, count));
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"读取输入寄存器失败: 地址={address}, 数量={count}");
            throw;
        }
    }

    /// <summary>
    /// 写入单个线圈
    /// </summary>
    public async Task WriteSingleCoilAsync(ushort address, bool value)
    {
        EnsureConnected();
        try
        {
            await Task.Run(() => _modbusMaster!.WriteSingleCoil(_slaveId, address, value));
            Logger.Debug($"写入线圈: 地址={address}, 值={value}");
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"写入线圈失败: 地址={address}, 值={value}");
            throw;
        }
    }

    /// <summary>
    /// 写入多个线圈
    /// </summary>
    public async Task WriteMultipleCoilsAsync(ushort address, bool[] values)
    {
        EnsureConnected();
        try
        {
            await Task.Run(() => _modbusMaster!.WriteMultipleCoils(_slaveId, address, values));
            Logger.Debug($"写入多个线圈: 地址={address}, 数量={values.Length}");
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"写入多个线圈失败: 地址={address}");
            throw;
        }
    }

    /// <summary>
    /// 写入单个寄存器
    /// </summary>
    public async Task WriteSingleRegisterAsync(ushort address, ushort value)
    {
        EnsureConnected();
        try
        {
            await Task.Run(() => _modbusMaster!.WriteSingleRegister(_slaveId, address, value));
            Logger.Debug($"写入寄存器: 地址={address}, 值={value}");
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"写入寄存器失败: 地址={address}, 值={value}");
            throw;
        }
    }

    /// <summary>
    /// 写入多个寄存器
    /// </summary>
    public async Task WriteMultipleRegistersAsync(ushort address, ushort[] values)
    {
        EnsureConnected();
        try
        {
            await Task.Run(() => _modbusMaster!.WriteMultipleRegisters(_slaveId, address, values));
            Logger.Debug($"写入多个寄存器: 地址={address}, 数量={values.Length}");
        }
        catch (Exception ex)
        {
            Logger.Error(ex, $"写入多个寄存器失败: 地址={address}");
            throw;
        }
    }

    /// <summary>
    /// 确保已连接
    /// </summary>
    private void EnsureConnected()
    {
        if (!IsConnected || _modbusMaster == null)
        {
            throw new InvalidOperationException("PLC未连接");
        }
    }

    public void Dispose()
    {
        Disconnect();
        GC.SuppressFinalize(this);
    }
}

