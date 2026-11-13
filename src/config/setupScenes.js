export const SETUP_SCENES = [
  {
    id: 0,
    name: "arrival",
    titleKey: "setup.arrival.title",
    size: { width: 140, height: 34 },
    enterEffect: "dropBounce",
    exitCondition: "eyesBlink",
    saveKey: null,
  },
  {
    id: 1,
    name: "hello",
    titleKey: "setup.hello.title",
    size: { width: 360, height: 120 },
    enterEffect: "handwriting",
    exitCondition: "getStarted",
    saveKey: null,
  },
  {
    id: 2,
    name: "name",
    titleKey: "setup.name.title",
    size: { width: 440, height: 210 },
    enterEffect: "slideUpBlur",
    exitCondition: "enterKeyOrButton",
    saveKey: "general.displayName",
  },
  {
    id: 3,
    name: "style",
    titleKey: "setup.style.title",
    size: { width: 480, height: 240 },
    enterEffect: "slideUpBlur",
    exitCondition: "selection",
    saveKey: "island.style",
  },
  {
    id: 4,
    name: "alerts",
    titleKey: "setup.alerts.title",
    size: { width: 480, height: 252 },
    enterEffect: "slideUpBlur",
    exitCondition: "alertsCompleted",
    saveKey: "alerts.types",
  },
  {
    id: 5,
    name: "home",
    titleKey: "setup.home.title",
    size: { width: 480, height: 252 },
    enterEffect: "slideUpBlur",
    exitCondition: "chipsChosen",
    saveKey: "homeDock.homeChips",
  },
  {
    id: 6,
    name: "clipboard",
    titleKey: "setup.clipboard.title",
    size: { width: 480, height: 252 },
    enterEffect: "slideUpBlur",
    exitCondition: "copyOrSkip",
    saveKey: "clipboard.enabled",
  },
  {
    id: 7,
    name: "dragDrop",
    titleKey: "setup.dragDrop.title",
    size: { width: 480, height: 252 },
    enterEffect: "slideUpBlur",
    exitCondition: "dropOrDemo",
    saveKey: null,
  },
  {
    id: 8,
    name: "shortcutsStartup",
    titleKey: "setup.shortcuts.title",
    size: { width: 480, height: 252 },
    enterEffect: "slideUpBlur",
    exitCondition: "saveHotkey",
    saveKey: "general.startWithWindows",
  },
  {
    id: 9,
    name: "google",
    titleKey: "setup.google.title",
    size: { width: 480, height: 252 },
    enterEffect: "slideUpBlur",
    exitCondition: "connectOrSkip",
    saveKey: "accounts.google",
  },
  {
    id: 10,
    name: "finish",
    titleKey: "setup.finish.title",
    size: { width: 480, height: 252 },
    enterEffect: "slideUpBlur",
    exitCondition: "done",
    saveKey: "firstRun.completed",
  },
];

export function getSceneConfig(stepId) {
  return SETUP_SCENES.find((s) => s.id === stepId) || SETUP_SCENES[1];
}

export function getTimeGreeting(date = new Date()) {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) return "Good morning";
  if (hours >= 12 && hours < 17) return "Good afternoon";
  if (hours >= 17 && hours < 22) return "Good evening";
  return "Good night";
}
