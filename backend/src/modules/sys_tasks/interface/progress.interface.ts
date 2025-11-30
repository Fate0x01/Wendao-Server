export interface IProgress {
  // 当前时间戳
  timestamp: number
  // 当前步骤信息
  step: string
  // 当前进度百分比
  progress: number
}
