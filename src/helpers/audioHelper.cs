using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace AuraIsland.Helpers
{
    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    class MMDevEnum { }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDevEnum
    {
        int f();
        [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice dev);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDevice
    {
        [PreserveSig] int Activate(ref Guid id, int clsCtx, IntPtr actParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
    }

    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume
    {
        int f1(); int f2(); int f3();
        int SetMasterVolumeLevel(float fLevelDB, ref Guid g);
        [PreserveSig] int SetMasterVolumeLevelScalar(float fLevel, ref Guid g);
        int GetMasterVolumeLevel(out float pf);
        [PreserveSig] int GetMasterVolumeLevelScalar(out float pf);
        [PreserveSig] int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid g);
        [PreserveSig] int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
    }

    class AudioProgram
    {
        [DllImport("user32.dll", SetLastError = true)]
        static extern bool LockWorkStation();

        [DllImport("powrprof.dll", SetLastError = true)]
        static extern bool SetSuspendState(bool hibernate, bool forceCritical, bool disableWakeEvent);

        static IAudioEndpointVolume GetEndpoint()
        {
            try
            {
                var e = (IMMDevEnum)new MMDevEnum();
                IMMDevice d;
                e.GetDefaultAudioEndpoint(0, 1, out d);
                if (d == null) return null;
                var g = typeof(IAudioEndpointVolume).GUID;
                object o;
                d.Activate(ref g, 1, IntPtr.Zero, out o);
                return (IAudioEndpointVolume)o;
            }
            catch
            {
                return null;
            }
        }

        static void PrintAudioStatus(IAudioEndpointVolume ep)
        {
            float v = 0;
            bool m = false;
            ep.GetMasterVolumeLevelScalar(out v);
            ep.GetMute(out m);
            int vol = (int)Math.Round(v * 100);
            Console.WriteLine("{\"volume\":" + vol + ",\"isMuted\":" + (m ? "true" : "false") + ",\"success\":true}");
        }

        static void PrintBatteryStatus()
        {
            try
            {
                var p = SystemInformation.PowerStatus;
                int pct = (int)Math.Round(p.BatteryLifePercent * 100);
                if (pct < 0) pct = 100;
                bool isAC = p.PowerLineStatus == PowerLineStatus.Online;
                bool hasBattery = !p.BatteryChargeStatus.HasFlag(BatteryChargeStatus.NoSystemBattery);
                bool charging = isAC && pct < 100;
                Console.WriteLine("{\"percent\":" + pct + ",\"charging\":" + (charging ? "true" : "false") + ",\"isAC\":" + (isAC ? "true" : "false") + ",\"hasBattery\":" + (hasBattery ? "true" : "false") + ",\"success\":true}");
            }
            catch (Exception ex)
            {
                Console.WriteLine("{\"percent\":100,\"charging\":false,\"isAC\":true,\"hasBattery\":false,\"success\":false,\"error\":\"" + ex.Message + "\"}");
            }
        }

        static void ExecutePowerAction(string act)
        {
            try
            {
                switch (act)
                {
                    case "lock":
                        LockWorkStation();
                        Console.WriteLine("{\"action\":\"lock\",\"success\":true}");
                        break;
                    case "sleep":
                        SetSuspendState(false, false, false);
                        Console.WriteLine("{\"action\":\"sleep\",\"success\":true}");
                        break;
                    case "restart":
                        Process.Start(new ProcessStartInfo("shutdown.exe", "/r /t 0") { CreateNoWindow = true, UseShellExecute = false });
                        Console.WriteLine("{\"action\":\"restart\",\"success\":true}");
                        break;
                    case "shutdown":
                        Process.Start(new ProcessStartInfo("shutdown.exe", "/s /t 0") { CreateNoWindow = true, UseShellExecute = false });
                        Console.WriteLine("{\"action\":\"shutdown\",\"success\":true}");
                        break;
                    case "signout":
                        Process.Start(new ProcessStartInfo("shutdown.exe", "/l") { CreateNoWindow = true, UseShellExecute = false });
                        Console.WriteLine("{\"action\":\"signout\",\"success\":true}");
                        break;
                    default:
                        Console.WriteLine("{\"error\":\"Unknown action\",\"success\":false}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("{\"success\":false,\"error\":\"" + ex.Message + "\"}");
            }
        }

        static void Main(string[] args)
        {
            try
            {
                string cmd = args.Length > 0 ? args[0].ToLowerInvariant() : "get";

                if (cmd == "battery")
                {
                    PrintBatteryStatus();
                    return;
                }

                if (cmd == "action" && args.Length > 1)
                {
                    ExecutePowerAction(args[1].ToLowerInvariant());
                    return;
                }

                var ep = GetEndpoint();
                if (ep == null)
                {
                    Console.WriteLine("{\"volume\":50,\"isMuted\":false,\"success\":false}");
                    return;
                }

                if (cmd == "set" && args.Length > 1)
                {
                    int val;
                    if (int.TryParse(args[1], out val))
                    {
                        val = Math.Max(0, Math.Min(100, val));
                        var g = Guid.Empty;
                        ep.SetMasterVolumeLevelScalar((float)val / 100.0f, ref g);
                    }
                }
                else if (cmd == "mute")
                {
                    bool currentMute = false;
                    ep.GetMute(out currentMute);
                    var g = Guid.Empty;
                    bool newMute = args.Length > 1 ? args[1] == "1" || args[1].ToLowerInvariant() == "true" : !currentMute;
                    ep.SetMute(newMute, ref g);
                }
                else if (cmd == "step" && args.Length > 1)
                {
                    int step;
                    if (int.TryParse(args[1], out step))
                    {
                        float current;
                        ep.GetMasterVolumeLevelScalar(out current);
                        int currentPercent = (int)Math.Round(current * 100);
                        int target = Math.Max(0, Math.Min(100, currentPercent + step));
                        var g = Guid.Empty;
                        ep.SetMasterVolumeLevelScalar((float)target / 100.0f, ref g);
                    }
                }

                PrintAudioStatus(ep);
            }
            catch (Exception ex)
            {
                Console.WriteLine("{\"volume\":50,\"isMuted\":false,\"success\":false,\"error\":\"" + ex.Message + "\"}");
            }
        }
    }
}
