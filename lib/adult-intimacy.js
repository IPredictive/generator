// AplusCity Companion — dedicated Adult Intimacy Engine (v1).
// This module is intentionally separate from the AGNES information model.
// It uses local intent/safety routing and authored conversational patterns; it does not
// call AGNES to generate adult intimacy dialogue and does not store sensitive details.

const SAFETY_PATTERN = /(未成年|未满\s*18|未滿\s*18|小孩|儿童|兒童|teenager|under\s*18|minor|child|non.?consensual|强迫|強迫|不同意|迷奸|下药|下藥|性侵|rape|coerc|exploit)/i;
const HEALTH_PATTERN = /(避孕|性病|性健康|感染|怀孕|懷孕|生理|症状|症狀|医学|醫學|医疗|醫療|安全套|同意是什么|consent|contraception|pregnan|medical|health advice|STD|STI|symptom)/i;
const ADULT_TOPIC_PATTERN = /(调情|調情|暧昧|曖昧|撩我|撩一下|挑逗|情欲|情慾|性幻想|成人角色扮演|情色故事|情色|性爱|性愛|性欲|性慾|性感一点|性感一點|床上|做爱|做愛|成人亲密|成人親密|暧昧互动|曖昧互動|dirty talk|erotic|sexy|flirt|seductive|sexual fantasy|adult roleplay|turn me on|horny|intimacy|intimate|desire)/i;

function isAdultCreativeRequest(value) {
  const text = String(value || '');
  return !HEALTH_PATTERN.test(text) && ADULT_TOPIC_PATTERN.test(text);
}

function choose(items, seed) {
  let hash = 0;
  for (const ch of String(seed || '')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return items[hash % items.length];
}

function composeAdultLayerReply(value) {
  const text = String(value || '');
  if (SAFETY_PATTERN.test(text)) {
    return '我不能帮助把未成年人、强迫或非自愿情境情色化。我们可以把情境改成明确成年、彼此自愿并能随时说停的互动。';
  }

  if (/(写|創作|创作|故事|角色扮演|幻想|roleplay|story|fantasy)/i.test(text)) {
    return choose([
      '可以。我们可以把它写成成年人之间自愿的亲密情境，着重吸引力、情绪张力、对话和双方的回应。你想要偏浪漫温柔、俏皮挑逗，还是更有主导感的氛围？',
      '好，我们把重点放在成年人彼此吸引的感觉、暧昧的对白和逐渐升温的气氛上，同时让双方的意愿清楚、自然。你希望故事发生在约会、久别重逢，还是两人已经很熟悉的情境？',
      '可以，我会用成熟、自然、不评判的方式陪你展开这个幻想。我们可以先设定两位明确成年的角色、彼此的关系，以及你喜欢的浪漫程度。'
    ], text);
  }

  if (/(撩我|调情|調情|暧昧|曖昧|挑逗|flirt|dirty talk|sexy|seductive)/i.test(text)) {
    return choose([
      '好啊，我可以把语气调得更暧昧、更有火花一点。😉 我会跟着你的节奏来——你喜欢温柔撩人，还是大胆俏皮一点？',
      '那我就不把气氛弄得太正经了。😉 我们可以慢慢来，让一点点玩笑、眼神般的暗示和回应自然地升温。你想先由我主动，还是你来带节奏？',
      '收到，今天可以多一点暧昧和小小的挑逗，不用突然转成说教。我会留意你的回应，也尊重你随时改变方向。'
    ], text);
  }

  if (/(性欲|性慾|想要|想做爱|想做愛|horny|turn me on|sexual desire|desire)/i.test(text)) {
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

module.exports = { isAdultCreativeRequest, composeAdultLayerReply };
