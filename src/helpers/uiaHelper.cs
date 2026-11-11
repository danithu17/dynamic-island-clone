using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Automation;

namespace AuraIsland.Helpers
{
    class Program
    {
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern IntPtr GetMenu(IntPtr hWnd);

        [DllImport("user32.dll", SetLastError = true)]
        static extern int GetMenuItemCount(IntPtr hMenu);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        static extern int GetMenuString(IntPtr hMenu, uint uIDItem, [Out] StringBuilder lpString, int nMaxCount, uint uFlag);

        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr GetSubMenu(IntPtr hMenu, int nPos);

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetMenuItemID(IntPtr hMenu, int nPos);

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetMenuState(IntPtr hMenu, uint uId, uint uFlags);

        [DllImport("user32.dll")]
        static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        const uint MF_BYPOSITION = 0x0400;
        const uint MF_SEPARATOR = 0x0800;
        const uint MF_DISABLED = 0x0002;
        const uint MF_GRAYED = 0x0001;
        const uint WM_COMMAND = 0x0111;

        static void Main(string[] args)
        {
            if (args.Length < 2)
            {
                Console.WriteLine("{\"found\":false,\"error\":\"Usage: uiaHelper.exe <query|invoke> <hwnd> [path/id]\"}");
                return;
            }

            string command = args[0].ToLowerInvariant();
            long hwndNum = 0;
            if (!long.TryParse(args[1], out hwndNum) || hwndNum <= 0)
            {
                Console.WriteLine("{\"found\":false,\"error\":\"Invalid HWND\"}");
                return;
            }

            IntPtr hWnd = new IntPtr(hwndNum);

            try
            {
                if (command == "query")
                {
                    QueryMenus(hWnd);
                }
                else if (command == "invoke" && args.Length >= 3)
                {
                    InvokeMenuItem(hWnd, args[2]);
                }
                else
                {
                    Console.WriteLine("{\"found\":false,\"error\":\"Unknown command\"}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(string.Format("{{\"found\":false,\"error\":{0}}}", EscapeJson(ex.Message)));
            }
        }

        static void QueryMenus(IntPtr hWnd)
        {
            // 1. Try Win32 standard menu first (classic apps like notepad, mmc, regedit)
            IntPtr hMenu = GetMenu(hWnd);
            if (hMenu != IntPtr.Zero)
            {
                int count = GetMenuItemCount(hMenu);
                if (count > 0)
                {
                    StringBuilder sb = new StringBuilder();
                    sb.Append("{\"found\":true,\"layer\":\"mirror\",\"source\":\"win32\",\"menus\":[");
                    bool firstTop = true;

                    for (int i = 0; i < count; i++)
                    {
                        StringBuilder titleBuf = new StringBuilder(256);
                        GetMenuString(hMenu, (uint)i, titleBuf, 256, MF_BYPOSITION);
                        string rawTitle = titleBuf.ToString().Replace("&", "");
                        if (string.IsNullOrEmpty(rawTitle)) continue;

                        if (!firstTop) sb.Append(",");
                        firstTop = false;

                        sb.Append("{\"label\":").Append(EscapeJson(rawTitle)).Append(",\"items\":[");

                        IntPtr hSub = GetSubMenu(hMenu, i);
                        if (hSub != IntPtr.Zero)
                        {
                            int subCount = GetMenuItemCount(hSub);
                            bool firstSub = true;
                            for (int j = 0; j < subCount; j++)
                            {
                                uint state = GetMenuState(hSub, (uint)j, MF_BYPOSITION);
                                if ((state & MF_SEPARATOR) != 0)
                                {
                                    if (!firstSub) sb.Append(",");
                                    firstSub = false;
                                    sb.Append("{\"type\":\"separator\"}");
                                    continue;
                                }

                                StringBuilder subBuf = new StringBuilder(256);
                                GetMenuString(hSub, (uint)j, subBuf, 256, MF_BYPOSITION);
                                string subTitle = subBuf.ToString().Replace("&", "");
                                if (string.IsNullOrEmpty(subTitle)) continue;

                                string label = subTitle;
                                string shortcut = "";
                                int tabIdx = subTitle.IndexOf('\t');
                                if (tabIdx >= 0)
                                {
                                    label = subTitle.Substring(0, tabIdx).Trim();
                                    shortcut = subTitle.Substring(tabIdx + 1).Trim();
                                }

                                uint cmdId = GetMenuItemID(hSub, j);
                                bool enabled = (state & (MF_DISABLED | MF_GRAYED)) == 0;

                                if (!firstSub) sb.Append(",");
                                firstSub = false;

                                sb.Append("{");
                                sb.Append("\"label\":").Append(EscapeJson(label)).Append(",");
                                sb.Append("\"shortcut\":").Append(EscapeJson(shortcut)).Append(",");
                                sb.Append("\"cmdId\":").Append(cmdId).Append(",");
                                sb.Append("\"enabled\":").Append(enabled ? "true" : "false");
                                sb.Append("}");
                            }
                        }

                        sb.Append("]}");
                    }

                    sb.Append("]}");
                    Console.WriteLine(sb.ToString());
                    return;
                }
            }

            // 2. Query Windows UI Automation
            AutomationElement root = AutomationElement.FromHandle(hWnd);
            if (root == null)
            {
                Console.WriteLine("{\"found\":false}");
                return;
            }

            PropertyCondition condMenuBar = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.MenuBar);
            AutomationElement menuBar = root.FindFirst(TreeScope.Children | TreeScope.Descendants, condMenuBar);

            if (menuBar == null)
            {
                Console.WriteLine("{\"found\":false}");
                return;
            }

            PropertyCondition condItem = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.MenuItem);
            AutomationElementCollection topItems = menuBar.FindAll(TreeScope.Children, condItem);

            if (topItems == null || topItems.Count == 0)
            {
                Console.WriteLine("{\"found\":false}");
                return;
            }

            StringBuilder uiaJson = new StringBuilder();
            uiaJson.Append("{\"found\":true,\"layer\":\"mirror\",\"source\":\"uia\",\"menus\":[");
            bool firstUiaTop = true;

            for (int i = 0; i < topItems.Count; i++)
            {
                AutomationElement topItem = topItems[i];
                string name = topItem.Current.Name ?? "";
                if (string.IsNullOrEmpty(name)) continue;

                if (!firstUiaTop) uiaJson.Append(",");
                firstUiaTop = false;

                uiaJson.Append("{\"label\":").Append(EscapeJson(name)).Append(",\"items\":[");

                AutomationElementCollection subItems = topItem.FindAll(TreeScope.Children | TreeScope.Descendants, condItem);
                if (subItems != null && subItems.Count > 0)
                {
                    bool firstChild = true;
                    for (int j = 0; j < subItems.Count; j++)
                    {
                        AutomationElement child = subItems[j];
                        string childName = child.Current.Name ?? "";
                        if (string.IsNullOrEmpty(childName)) continue;

                        string accel = child.Current.AcceleratorKey ?? "";
                        bool isEnabled = child.Current.IsEnabled;

                        if (!firstChild) uiaJson.Append(",");
                        firstChild = false;

                        uiaJson.Append("{");
                        uiaJson.Append("\"label\":").Append(EscapeJson(childName)).Append(",");
                        uiaJson.Append("\"shortcut\":").Append(EscapeJson(accel)).Append(",");
                        uiaJson.Append("\"path\":").Append(EscapeJson(name + "/" + childName)).Append(",");
                        uiaJson.Append("\"enabled\":").Append(isEnabled ? "true" : "false");
                        uiaJson.Append("}");
                    }
                }

                uiaJson.Append("]}");
            }

            uiaJson.Append("]}");
            Console.WriteLine(uiaJson.ToString());
        }

        static void InvokeMenuItem(IntPtr hWnd, string target)
        {
            // If target is numeric cmdId for Win32 menu:
            uint cmdId = 0;
            if (uint.TryParse(target, out cmdId) && cmdId > 0)
            {
                PostMessage(hWnd, WM_COMMAND, new IntPtr(cmdId), IntPtr.Zero);
                Console.WriteLine("{\"success\":true}");
                return;
            }

            // Otherwise UIA path invocation:
            AutomationElement root = AutomationElement.FromHandle(hWnd);
            if (root == null)
            {
                Console.WriteLine("{\"success\":false,\"error\":\"Target window not found\"}");
                return;
            }

            string[] parts = target.Split('/');
            string targetName = parts[parts.Length - 1].Trim();

            PropertyCondition condName = new PropertyCondition(AutomationElement.NameProperty, targetName);
            AutomationElement item = root.FindFirst(TreeScope.Descendants, condName);

            if (item != null)
            {
                object patternObj = null;
                if (item.TryGetCurrentPattern(InvokePattern.Pattern, out patternObj))
                {
                    ((InvokePattern)patternObj).Invoke();
                    Console.WriteLine("{\"success\":true}");
                    return;
                }
                else if (item.TryGetCurrentPattern(ExpandCollapsePattern.Pattern, out patternObj))
                {
                    ((ExpandCollapsePattern)patternObj).Expand();
                    Console.WriteLine("{\"success\":true}");
                    return;
                }
            }

            Console.WriteLine("{\"success\":false,\"error\":\"Item not invokable\"}");
        }

        static string EscapeJson(string s)
        {
            if (s == null) return "\"\"";
            StringBuilder sb = new StringBuilder();
            sb.Append('"');
            foreach (char c in s)
            {
                switch (c)
                {
                    case '\\': sb.Append("\\\\"); break;
                    case '"': sb.Append("\\\""); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < ' ')
                            sb.Append(string.Format("\\u{0:x4}", (int)c));
                        else
                            sb.Append(c);
                        break;
                }
            }
            sb.Append('"');
            return sb.ToString();
        }
    }
}
