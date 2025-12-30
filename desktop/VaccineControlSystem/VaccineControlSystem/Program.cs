using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using NLog;
using NLog.Extensions.Logging;
using VaccineControlSystem.Core.Plc;
using VaccineControlSystem.Core.Device;
using VaccineControlSystem.Services;
using VaccineControlSystem.UI;

namespace VaccineControlSystem;

/// <summary>
/// 疫苗自动分拣控制系统 - 程序入口
/// </summary>
static class Program
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    
    /// <summary>
    /// 应用程序主入口点
    /// </summary>
    [STAThread]
    static void Main()
    {
        try
        {
            Logger.Info("========================================");
            Logger.Info("疫苗自动分拣控制系统 启动");
            Logger.Info("========================================");
            
            // 配置应用程序
            ApplicationConfiguration.Initialize();
            
            // 构建服务容器
            var services = ConfigureServices();
            var serviceProvider = services.BuildServiceProvider();
            
            // 设置全局异常处理
            Application.ThreadException += Application_ThreadException;
            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;
            
            // 启动主窗体
            var mainForm = serviceProvider.GetRequiredService<MainForm>();
            Application.Run(mainForm);
            
            Logger.Info("系统正常退出");
        }
        catch (Exception ex)
        {
            Logger.Fatal(ex, "系统启动失败");
            MessageBox.Show($"系统启动失败: {ex.Message}", "错误", 
                MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            LogManager.Shutdown();
        }
    }

    /// <summary>
    /// 配置依赖注入服务
    /// </summary>
    private static IServiceCollection ConfigureServices()
    {
        var services = new ServiceCollection();
        
        // 加载配置
        var configuration = new ConfigurationBuilder()
            .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .Build();
        
        services.AddSingleton<IConfiguration>(configuration);
        
        // 注册日志
        services.AddLogging(builder =>
        {
            builder.AddNLog();
        });
        
        // 注册PLC通信服务
        services.AddSingleton<IPlcClient, ModbusTcpClient>();
        services.AddSingleton<PlcConnectionManager>();
        
        // 注册设备控制服务
        services.AddSingleton<ChannelController>();
        services.AddSingleton<ConveyorController>();
        services.AddSingleton<TemperatureCollector>();
        services.AddSingleton<AlarmController>();
        
        // 注册业务服务
        services.AddSingleton<SortingService>();
        services.AddSingleton<InventoryService>();
        services.AddSingleton<AlarmService>();
        services.AddSingleton<TaskQueueService>();
        
        // 注册gRPC客户端
        services.AddSingleton<GrpcClientService>();
        
        // 注册Redis服务
        services.AddSingleton<RedisService>();
        
        // 注册窗体
        services.AddTransient<MainForm>();
        
        return services;
    }

    /// <summary>
    /// 处理UI线程异常
    /// </summary>
    private static void Application_ThreadException(object sender, ThreadExceptionEventArgs e)
    {
        Logger.Error(e.Exception, "UI线程异常");
        MessageBox.Show($"发生错误: {e.Exception.Message}", "错误",
            MessageBoxButtons.OK, MessageBoxIcon.Error);
    }

    /// <summary>
    /// 处理非UI线程异常
    /// </summary>
    private static void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        var ex = e.ExceptionObject as Exception;
        Logger.Fatal(ex, "未处理的异常");
        
        if (e.IsTerminating)
        {
            MessageBox.Show($"严重错误，程序即将退出: {ex?.Message}", "致命错误",
                MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}

