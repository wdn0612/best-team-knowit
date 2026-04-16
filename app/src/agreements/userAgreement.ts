/**
 * 小知了 用户协议
 * 版本：1.0   生效日期：2026-04-11
 *
 * 维护说明：
 * - 用结构化数据描述协议条款，UI 层负责渲染样式。
 * - 修改后请同步更新 AGREEMENT_VERSION 和 EFFECTIVE_DATE。
 */

export const AGREEMENT_VERSION = '1.0'
export const EFFECTIVE_DATE = '2026年4月11日'

export type AgreementBlock =
  | { type: 'lead'; text: string }
  | { type: 'section'; index: string; title: string }
  | { type: 'subtitle'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'callout'; tone: 'warn' | 'info'; title?: string; text: string }
  | { type: 'footer'; text: string }

export const USER_AGREEMENT: AgreementBlock[] = [
  {
    type: 'lead',
    text: '欢迎使用小知了。请在开始使用前仔细阅读本协议。您下载、安装、注册或继续使用本应用，即表示您已充分理解并同意本协议的全部条款。如您不同意任何条款，请立即停止使用。',
  },

  { type: 'section', index: '一', title: '服务说明' },
  {
    type: 'paragraph',
    text: '小知了由 KnowIt Team 开发并运营，是一款基于人工智能的情感陪伴与情绪记录应用。我们为您提供基于大语言模型的对话陪伴、日记记录与情绪洞察功能，帮助您梳理思绪、发现情绪规律。',
  },
  {
    type: 'callout',
    tone: 'warn',
    title: '重要声明',
    text: '小知了不是心理咨询机构或医疗机构，不提供任何形式的心理治疗、心理诊断、精神医学评估或其他医疗服务。本应用内的 AI 对话、情绪洞察及任何由系统生成的内容，均不构成专业心理健康建议，不能替代持证心理咨询师、精神科医师或其他医疗专业人员的判断与服务。',
  },

  { type: 'section', index: '二', title: '关于 AI 生成内容' },
  {
    type: 'paragraph',
    text: '本应用的回复内容由大语言模型实时生成，而非预先编写的固定内容。请您在使用时了解：',
  },
  {
    type: 'bullets',
    items: [
      'AI 可能产生不准确、不完整、不合时宜，甚至与事实不符的表述，请勿将其作为决策依据。',
      'AI 所呈现的"共情"、"理解"与"关心"是对语言模式的模拟，并非真实情感，也不构成真实的人际关系。',
      '您与 AI 的对话不是专业咨询关系，不受保密义务与诊疗责任约束。',
      '如内容涉及医疗、法律、金融等专业领域，请以相关持牌专业人员的意见为准。',
    ],
  },

  { type: 'section', index: '三', title: '紧急情况与危机资源' },
  {
    type: 'callout',
    tone: 'warn',
    text: '本应用无法识别或响应紧急状况。如您或您身边的人正处于自伤、自杀或伤害他人的风险中，请立即拨打以下电话或前往就近医院急诊。',
  },
  {
    type: 'bullets',
    items: [
      '急救电话：120',
      '报警电话：110',
      '全国心理援助热线（国家卫健委）：400-161-9995',
      '北京心理危机研究与干预中心：010-82951332',
      '希望 24 热线：400-161-9995',
    ],
  },

  { type: 'section', index: '四', title: '用户资格' },
  { type: 'subtitle', text: '年龄要求' },
  {
    type: 'paragraph',
    text: '本应用面向年满 18 周岁的用户。未满 18 周岁的未成年人须在监护人知情并同意的情况下方可使用，监护人应对其使用行为承担监督责任。',
  },
  { type: 'subtitle', text: '账户安全' },
  {
    type: 'paragraph',
    text: '您应妥善保管设备及应用的访问权限，由您设备被他人使用而产生的一切后果由您自行承担。',
  },

  { type: 'section', index: '五', title: '用户行为规范' },
  { type: 'paragraph', text: '您承诺在使用本应用过程中不会：' },
  {
    type: 'bullets',
    items: [
      '发送或传播违法、淫秽、暴力、歧视、仇恨、骚扰或其他有害信息；',
      '冒充他人或提供虚假信息，获取他人隐私；',
      '攻击、破坏、逆向工程本应用或其 AI 系统，或利用漏洞进行不正当使用；',
      '将本应用用于任何商业目的，包括数据抓取、竞品分析、二次分发；',
      '违反中华人民共和国及您所在地区适用的法律法规。',
    ],
  },
  {
    type: 'paragraph',
    text: '若您违反上述规范，我们有权在不事先通知的情况下暂停或终止您对本应用的使用，并保留追究法律责任的权利。',
  },

  { type: 'section', index: '六', title: '数据收集与隐私' },
  { type: 'subtitle', text: '我们收集的信息' },
  {
    type: 'bullets',
    items: [
      '对话内容：您与 AI 的聊天记录，用于生成回复与情绪洞察。',
      '日记条目：您主动创建的日记文本。',
      '情绪洞察：由对话内容派生的情绪摘要与标签。',
      '初始问卷：引导流程中您填写的问题答案，用于初始化个人画像。',
    ],
  },
  { type: 'subtitle', text: '存储与处理' },
  {
    type: 'paragraph',
    text: '上述数据默认以 AsyncStorage 方式存储于您的设备本地。当您发起对话时，我们会将必要的上下文提交至大语言模型服务提供方以完成回复生成；服务提供方对所接收数据的处理受其自身政策约束。',
  },
  { type: 'subtitle', text: '您的控制权' },
  {
    type: 'bullets',
    items: [
      '您可以在"设置"中随时删除聊天记录、日记与个人画像。',
      '删除操作不可撤销，请谨慎确认后进行。',
      '如需彻底删除所有数据，请通过下方联系方式与我们联系。',
    ],
  },

  { type: 'section', index: '七', title: '知识产权' },
  {
    type: 'paragraph',
    text: '本应用的软件、界面设计、图标、商标等均由 KnowIt Team 或相关权利人享有知识产权，未经授权不得复制、修改或用于商业用途。您保留对您自行创作的日记与对话内容的权利，并授予我们为提供本服务所必需的、有限的、非独占的使用许可。',
  },

  { type: 'section', index: '八', title: '免责与责任限制' },
  {
    type: 'paragraph',
    text: '在法律允许的最大范围内，KnowIt Team 不对以下情形承担责任：',
  },
  {
    type: 'bullets',
    items: [
      '因 AI 生成内容的不准确、不适用而产生的任何直接或间接损失；',
      '因用户将 AI 内容作为心理健康、医疗、法律或其他专业建议依据而产生的后果；',
      '因网络、设备、第三方服务不可用或中断导致的服务异常；',
      '因用户违反本协议或适用法律引发的任何纠纷。',
    ],
  },

  { type: 'section', index: '九', title: '协议的修改' },
  {
    type: 'paragraph',
    text: '我们可能根据法律法规或产品迭代更新本协议。更新后，我们将通过应用内通知或在本页面更新版本号及生效日期。若您在更新生效后继续使用本应用，视为您同意更新后的协议；若您不同意，请停止使用并删除相关数据。',
  },

  { type: 'section', index: '十', title: '适用法律与争议解决' },
  {
    type: 'paragraph',
    text: '本协议的订立、生效、解释及争议解决均适用中华人民共和国法律（不含港澳台地区法律）。因本协议产生的任何争议，双方应友好协商解决；协商不成的，任一方可向 KnowIt Team 所在地有管辖权的人民法院提起诉讼。',
  },

  { type: 'section', index: '十一', title: '联系我们' },
  {
    type: 'paragraph',
    text: '如您对本协议有疑问，或希望申请数据删除、反馈问题，请通过以下方式联系我们：',
  },
  {
    type: 'bullets',
    items: [
      '邮箱：support@xinji.app',
      '回复时限：我们将在收到邮件后 5 个工作日内予以回复。',
    ],
  },

  { type: 'footer', text: `© ${new Date().getFullYear()} KnowIt Team　·　保留所有权利` },
]
