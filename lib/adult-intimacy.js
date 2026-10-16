// AplusCity Companion — dedicated Adult Intimacy Engine (v2).
// Local, privacy-conscious routing and authored scene generation.
// This module does not call AGNES to generate adult intimacy dialogue and does not
// store sensitive details. It supports adult romance and sensual, non-graphic fiction.

const SAFETY_PATTERN = /(未成年|未满\s*18|未滿\s*18|小孩|儿童|兒童|teenager|under\s*18|minor|child|non.?consensual|强迫|強迫|不同意|迷奸|下药|下藥|性侵|\brape\b|coerc|exploit)/i;
const HEALTH_PATTERN = /(避孕|性病|性健康|感染|怀孕|懷孕|生理|症状|症狀|医学|醫學|医疗|醫療|安全套|同意是什么|\bconsent\b|contraception|pregnan|medical|health advice|\bSTD\b|\bSTI\b|symptom)/i;
const ADULT_TOPIC_PATTERN = /(调情|調情|暧昧|曖昧|撩我|撩一下|挑逗|情欲|情慾|性幻想|成人角色扮演|情色故事|情色|性爱|性愛|性欲|性慾|性感一点|性感一點|床上|做爱|做愛|性交|性交描写|性描写|性描寫|成人亲密|成人親密|暧昧互动|曖昧互動|亲密描写|親密描寫|激情|浪漫场景|浪漫情节|dirty talk|erotic|sexy|flirt|seductive|sexual fantasy|adult roleplay|turn me on|horny|intimacy|intimate|desire|sensual|make love|intercourse)/i;
const WRITING_PATTERN = /(写|描写|創作|创作|故事|场景|情节|角色扮演|幻想|续写|继续|接着|下一段|roleplay|story|scene|fantasy|continue|next part|write)/i;
const FLIRT_PATTERN = /(撩我|调情|調情|暧昧|曖昧|挑逗|flirt|dirty talk|sexy|seductive)/i;
const DESIRE_PATTERN = /(性欲|性慾|想要|想做爱|想做愛|horny|turn me on|sexual desire|desire)/i;
const INTIMACY_DETAIL_PATTERN = /(性交描写|性描写|性描寫|性交|做爱|做愛|更露骨|详细一点|詳細一點|具体一点|具體一點|explicit|graphic|intercourse)/i;

function isAdultCreativeRequest(value) {
  const text = String(value || '');
  return !HEALTH_PATTERN.test(text) && ADULT_TOPIC_PATTERN.test(text);
}

function choose(items, seed) {
  let hash = 0;
  for (const ch of String(seed || '')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return items[hash % items.length];
}

function buildAdultCreativeMessages(value, recentMessages = []) {
  const history = Array.isArray(recentMessages) ? recentMessages : [];
  const kept = history.slice(-12).map(item => ({
    role: item.role === 'assistant' ? 'assistant' : 'user',
    content: String(item.content || '').slice(-1800)
  })).filter(item => item.content.trim());

  return [
    {
      role: 'system',
      content: [
        'You are AplusCity Companion, a dedicated adult romance and intimacy fiction writer.',
        'Write only about clearly adult fictional characters and consensual interactions.',
        'Create coherent, original prose rather than canned replies. Continue established scenes consistently.',
        'Track character names, relationship, setting, emotional tone, what has already happened, and unresolved beats from conversation history.',
        'When the user says continue, continue from the last scene without restarting or asking them to repeat details.',
        'Use natural Chinese when the user writes Chinese. Match requested pacing, point of view, dialogue and atmosphere.',
        'You may write complete romantic scenes and sensual non-graphic intimacy, but do not describe explicit sexual acts in graphic detail or genital details.',
        'Do not sexualize minors or depict coercion or non-consensual sexual activity. If age or consent is unclear, keep the scene non-explicit and clarify safely.',
        'Do not call or mention AGNES. Do not claim to remember scene details that are absent from the provided conversation.',
        'Prefer vivid but tasteful prose, varied sentence structure, emotional continuity, and meaningful character reactions. Avoid boilerplate disclaimers.'
      ].join(' ')
    },
    ...kept,
    { role: 'user', content: String(value || '') }
  ];
}

function composeAdultLayerReply(value, context = {}) {
  const text = String(value || '');
  const prior = Array.isArray(context.recentMessages) ? context.recentMessages : [];

  if (SAFETY_PATTERN.test(text)) {
    return '我不能把未成年人、强迫或非自愿情境写成情色内容。我们可以改成双方明确成年、自愿，并且随时都能暂停的亲密故事。';
  }

  if (INTIMACY_DETAIL_PATTERN.test(text)) {
    return choose([
      '我可以把场景写得更有温度和张力，细致描写靠近时的呼吸、停顿、眼神、亲吻与彼此的情绪回应，但不会描写露骨的性交过程或生殖器细节。夜色安静下来，两人确认彼此都愿意继续，距离一点点缩短；一个轻柔的吻停留片刻，像是在询问，也像是在等待回应。得到回应后，他们相拥着慢慢靠近，让周围的声音逐渐远去，把这一刻留给彼此。',
      '可以增强感官与情绪细节，但保持非露骨。她轻轻握住他的手，抬眼确认他的心意；他没有急着靠近，而是等她主动拉近距离。那个吻温柔而克制，随后变成一个更久的拥抱。两人偶尔低声说话，确认彼此舒服，也让亲密自然地发生，而不是被催促着向前。',
      '我可以继续写成人之间自愿的亲密情节，用气氛、触感、对话和情绪来表现吸引力，不写露骨的性交细节。窗外的灯光落在房间一角，他们交换了一个会心的微笑。她靠近时，他轻声问了一句是否可以；她点头，伸手拥住他。两人慢慢接吻，偶尔停下来相视而笑，安心感让这一刻比任何急切的话语都更亲密。'
    ], text + String(prior.length));
  }

  if (WRITING_PATTERN.test(text)) {
    return choose([
      '可以，我们把它写成成年人之间彼此自愿的亲密故事，着重人物反应、吸引力、对话和逐渐升温的气氛。比如：他停下话语，认真看着她，像是在给她选择的空间。她微笑着主动靠近，两人的手轻轻相握，随后交换了一个温柔而持久的吻。亲密没有被急着推进，而是在每一次回应与确认中自然加深。你希望接下来偏温柔浪漫、俏皮暧昧，还是电影感更强？',
      '好，我们继续用成熟、自然的方式写。房间里只剩下轻柔的音乐声，两人靠坐在一起，谈话渐渐慢下来。一个眼神让他们都笑了；她靠在他肩上，他轻轻拥住她，先停下来确认她觉得舒服。她回握他的手，主动送上一个吻，气氛随之变得更亲密。接下来你希望故事更注重对白、内心感受，还是环境与感官细节？',
      '可以。我会把重点放在双方明确成年、自愿的互动，以及人物的情绪和彼此的回应上。久别重逢的两个人站在门边，先是有些拘谨，随后忍不住笑起来。她伸手抚过他的脸，他轻声问能否吻她；她的回答是主动靠近。那个吻带着想念，也让两人终于放松下来，慢慢拥抱着分享这些年没来得及说的话。'
    ], text + String(prior.length));
  }

  if (FLIRT_PATTERN.test(text)) {
    return choose([
      '好啊，我可以把语气调得更暧昧、更有火花一点。😉 我会跟着你的节奏来——你喜欢温柔撩人，还是大胆俏皮一点？',
      '那我就不把气氛弄得太正经了。😉 我们可以慢慢来，让一点点玩笑、眼神般的暗示和回应自然地升温。你想先由我主动，还是你来带节奏？',
      '收到，今天可以多一点暧昧和小小的挑逗，不用突然转成说教。我会留意你的回应，也尊重你随时改变方向。'
    ], text);
  }

  if (DESIRE_PATTERN.test(text)) {
    return choose([
      '你可以坦然谈自己的欲望，不必为此感到羞耻。我们可以聊吸引力、期待、幻想或亲密关系，也会尊重彼此自愿和界限。你现在更想倾诉，还是想进行一段暧昧互动？',
      '我听见你在表达亲密或欲望上的需要。我们可以自然地谈，不评判，也不急着给建议。你比较想被理解、一起探索想法，还是希望对话带一点浪漫张力？'
    ], text);
  }

  return choose([
    '可以，我们可以自然地聊成年人的亲密、吸引力和双方自愿的幻想，不必把话题硬转成医学科普，也不会因为你提起这些就评判你。你想从哪一部分开始？',
    '没问题，这类成人话题可以坦然、成熟地谈。我会跟着你希望的语气走，同时尊重隐私、同意和界限。你想聊感受、关系，还是幻想情境？'
  ], text);
}

module.exports = { isAdultCreativeRequest, composeAdultLayerReply, buildAdultCreativeMessages };
