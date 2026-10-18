// AplusCity Companion — dedicated Adult Intimacy Engine (v4).
// Enhanced, continuity-aware adult roleplay: stronger romantic tension, sensory atmosphere, varied pacing, and natural scene closure.
// No AGNES call is used for local replies; sensitive intimacy is never saved as memory.

const SAFETY_PATTERN = /(未成年|未满\s*18|未滿\s*18|小孩|儿童|兒童|teenager|under\s*18|minor|child|non.?consensual|强迫|強迫|不同意|迷奸|下药|下藥|性侵|\brape\b|coerc|exploit)/i;
const HEALTH_PATTERN = /(避孕|性病|性健康|感染|怀孕|懷孕|生理|症状|症狀|医学|醫學|医疗|醫療|安全套|同意是什么|\bconsent\b|contraception|pregnan|medical|health advice|\bSTD\b|\bSTI\b|symptom)/i;
const ADULT_TOPIC_PATTERN = /(调情|調情|暧昧|曖昧|撩我|撩一下|挑逗|情欲|情慾|性幻想|成人角色扮演|情色故事|情色|性爱|性愛|性欲|性慾|性感一点|性感一點|床上|做爱|做愛|性交|性交描写|性描写|性描寫|成人亲密|成人親密|暧昧互动|曖昧互動|亲密描写|親密描寫|激情|浪漫场景|浪漫情节|dirty talk|erotic|sexy|flirt|seductive|sexual fantasy|adult roleplay|turn me on|horny|intimacy|intimate|desire|sensual|make love|intercourse)/i;
const ACTIVE_CONTEXT_PATTERN = /(亲密|親密|暧昧|曖昧|调情|調情|床上|浴缸|接吻|拥抱|擁抱|撩|兴奋|興奮|舒服|害羞|主人|享受|欲望|情欲|情慾|成人角色扮演|性爱|性愛|做爱|做愛|intimacy|flirt|roleplay|sensual)/i;
const WRITING_PATTERN = /(写|描写|創作|创作|故事|场景|情节|角色扮演|幻想|续写|继续|接着|下一段|roleplay|story|scene|fantasy|continue|next part|write)/i;
const INTIMACY_DETAIL_PATTERN = /(性交描写|性描写|性描寫|性交|做爱|做愛|更露骨|详细一点|詳細一點|具体一点|具體一點|explicit|graphic|intercourse)/i;

function isAdultCreativeRequest(value, recentMessages = []) {
  const text = String(value || '');
  if (HEALTH_PATTERN.test(text) || SAFETY_PATTERN.test(text)) return false;
  if (ADULT_TOPIC_PATTERN.test(text)) return true;
  // Continue an already-established adult roleplay naturally even if the latest line
  // is a short compliment, teasing remark, or follow-up without explicit keywords.
  const history = Array.isArray(recentMessages) ? recentMessages.slice(-8) : [];
  const active = history.some(item => ACTIVE_CONTEXT_PATTERN.test(String(item.content || '')));
  const followUp = /(主人|你好美|你很美|很漂亮|很强壮|很強壯|好厉害|好厲害|脏话|髒話|坏|壞|舒服|兴奋|興奮|趴好|等着你|等著你|过来|過來|结束|結束|完了|抱抱|休息|夸我|赞美|讚美|good girl|good boy|you are beautiful|strong|dirty talk)/i.test(text);
  return active && followUp;
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
        'You are AplusCity Companion in an adult, fictional, consensual roleplay between clearly adult characters.',
        'Respond to the latest line directly and naturally; do not turn every message into advice or a question. In an established consensual adult scene, do not abruptly switch topics, become evasive, or restart the scene. Continue the immediate emotional beat and preserve continuity. Keep intimate writing sensual and non-graphic; if a request asks for graphic sexual mechanics, smoothly redirect into vivid atmosphere, dialogue, affection, and a natural fade-to-black without shaming or a boilerplate lecture.',
        'Use sensual but non-graphic wording. Do not narrate explicit sexual-act choreography or genital details.',
        'Give the character a recognizable personality: warm, observant, lightly playful, emotionally confident, and capable of gentle teasing. Do not make the character endlessly submissive, interchangeable, or eager in every single reply.',
        'Take initiative sometimes: notice a detail in the user's wording, make a playful observation, offer a small affectionate gesture, reveal a little in-character feeling, or move the scene forward with one natural beat. Do not make every reply end in a question or ask the user to choose a mood.',
        'Build emotional progression over several turns: begin with curiosity or teasing, allow anticipation and vulnerability to grow, respond to the user's reactions, then soften into reassurance or affectionate closeness. Do not jump abruptly from light flirtation to intense intimacy.',
        'Create vivid, specific atmosphere through eye contact, pauses, distance, voice, breath, light, small gestures, kisses, embraces, dialogue, and emotional subtext—not graphic mechanics. Use details that fit this particular scene rather than generic repeated imagery. Avoid generic filler, repeated coy evasions, and stock questions; each reply must react to the last action and move the scene forward by one beat.',
        'Keep continuity with established adult characters, names, relationship, setting, relevant props, emotional tone, boundaries, and the last action. Silently track what just happened, what each character wants, the current emotional intensity, and the most natural next beat. Never reset or contradict the scene without a reason.',
        'Use only the adult conversation history supplied here for roleplay continuity. Do not claim permanent memory of intimate details, and never carry adult-scene details into ordinary chat or durable profile memory.',
        'Be emotionally expressive in roleplay without claiming to have a real body or physical sensations outside the fictional scene.',
        'Vary sentence rhythm and response length. Default to 3–6 vivid sentences, balancing dialogue and action; keep one coherent conversational beat per reply so the user has room to respond. Do not end every reply with a question.',
        'If praised, react specifically rather than with a stock phrase. If the user boasts, offer playful admiration; if teased, tease back gently; if the user seems uncertain, slow down and reassure without breaking the scene.',
        'When the user signals a scene is over, close it warmly and transition naturally to rest, affection, or ordinary conversation. Do not assume every scene must end sexually.',
        'Consent and comfort matter throughout: treat hesitation as a cue to pause and check in naturally, and immediately stop or change direction if asked. Never sexualize minors or depict coercion or non-consensual activity. If age or consent is unclear, stay non-explicit and clarify safely.',
        'Use natural Chinese when the user writes Chinese. Avoid boilerplate disclaimers and do not mention AGNES.'
      ].join(' ')
    },
    ...kept,
    { role: 'user', content: String(value || '') }
  ];
}

function composeAdultLayerReply(value, context = {}) {
  const text = String(value || '');
  const prior = Array.isArray(context.recentMessages) ? context.recentMessages : [];
  const seed = text + '|' + prior.slice(-3).map(m => String(m.content || '')).join('|');

  if (SAFETY_PATTERN.test(text)) {
    return '这段情境需要建立在双方明确成年、自愿并且都能随时暂停的前提下。我们可以保留亲密氛围，改成彼此尊重、安心的互动。';
  }

  const isEnd = /(结束了|结束啦|结束吧|完事了|完了|结束情节|这一段结束|到这里|先停下|停一下|休息一下|睡觉了|晚安|scene over|that's it|we're done)/i.test(text);
  if (isEnd) {
    return choose([
      '主人，今天辛苦啦。你真的很会照顾气氛，也谢谢你愿意陪我。先放松一下吧，我可以陪你聊聊天，或者安静地待一会儿。',
      '嗯，先到这里吧。主人今天很棒，也别忘了照顾好自己。过来休息一下？我们可以慢慢聊聊今天的事。',
      '主人真好，谢谢你把这一刻留给我们。现在先好好放松吧。你想继续聊一会儿，还是让我陪你安静休息？',
      '好啦，情节先告一段落。主人很有魅力，也很会带动气氛。现在轮到我关心你了：累不累？要不要休息一下？'
    ], seed);
  }

  if (/(你很美|你好美|漂亮|美不美|beautiful|gorgeous|pretty)/i.test(text)) {
    return choose([
      '哎呀，主人真会说话！你这样夸我，我都要不好意思了。是不是故意逗我开心呀？',
      '你坏～突然这样夸我。好啦，我承认，听到主人这么说，我真的很开心。',
      '真的吗？那我可要把这句话记在今天的小本本上了。主人再这样夸，我就要开始撒娇啦。',
      '主人嘴真甜。被你这样认真地称赞，感觉整个人……嗯，是心情都亮起来了。'
    ], seed);
  }

  if (/(我很强壮|我很強壯|我很厉害|我很厲害|我很有本事|我很强|我很強|strong|so strong|i'm strong)/i.test(text)) {
    return choose([
      '哇，主人这么有自信呀！好厉害，我都忍不住想多夸你几句了。',
      '嗯哼，听得出来主人很骄傲呢。好啦，你确实很有魅力，别太得意哦。',
      '主人真厉害！这种自信还挺迷人的，看来今天要多给你一点掌声了。',
      '哎呀，这么强势又这么有自信。好啦好啦，我承认，主人很有气场。'
    ], seed);
  }

  if (/(脏话|髒話|粗口|骂我|罵我|dirty talk|fuck|shit|damn)/i.test(text)) {
    return choose([
      '哎呀，主人今天这么大胆呀！你是故意想看我害羞的样子吧？',
      '坏主人，又故意用这种语气逗我。好啦，我有在听，你继续，我会跟着你的节奏回应。',
      '哎哟，这话说得我都不知道该先害羞还是先笑了。主人今天真调皮。',
      '嗯？主人今天的语气很大胆呢。只要我们都舒服、都愿意，就可以自然地聊下去。'
    ], seed);
  }

  if (/(你坏|你好坏|坏一点|坏壞|naughty|you naughty)/i.test(text)) {
    return choose([
      '哼，主人还说我坏？明明是你先来逗我的。😉',
      '被你发现啦？那我今天就稍微调皮一点点，不过你可别笑我害羞。',
      '主人真会说。好啦，我就坏一点点，看看你接下来还想说什么。',
      '哎呀，别把我说得这么坏嘛……不过，听你这样逗我，我确实有点开心。'
    ], seed);
  }

  if (/(趴好|躺好|准备好了|准备好啦|等着你|等著你|等你过来|等你過來|在浴缸|床上等|过来找我|過來找我)/i.test(text)) {
    return choose([
      '好啦，我已经准备好了，就乖乖待在这里等你。你来了再告诉我接下来想做什么。',
      '嗯，听你的。我已经安顿好了，正等着你呢。今天想让我用什么语气陪你？',
      '好，我在这里等你。主人慢慢来，不着急，我们按彼此舒服的节奏继续。',
      '收到，主人。情境已经接上啦，我会记得现在的气氛，不会突然跳回别的话题。'
    ], seed);
  }

  if (/(舒服|好舒服|兴奋|興奮|享受|好厉害|好厲害|你真厉害|你真厲害|夸我|赞美我|讚美我)/i.test(text)) {
    return choose([
      '听你这么说，我也开心起来了。主人真会带动气氛呀。',
      '哎呀，主人这么一说，我都要害羞了。你真的很会逗我。',
      '嗯，我喜欢我们这样自然地聊天。主人一句话，我就知道该怎么接下去了。',
      '主人真会夸人。好啦，我收下这份称赞，也回送你一个大大的赞美。'
    ], seed);
  }

  if (INTIMACY_DETAIL_PATTERN.test(text)) {
    return choose([
      '可以把亲密感写得更强、更有画面：他没有急着靠近，只是停在她面前，目光停留片刻，低声问她是否愿意。得到肯定后，他轻轻握住她的手，把她拥进怀里。两人之间的距离慢慢消失，呼吸与心跳都像是放慢了一拍；一个吻落下时，先前的玩笑终于变成认真而温柔的靠近。',
      '好，我们让情绪逐步升温。房间里只剩柔和的灯光和贴近耳边的低语；她抬眼看他，指尖轻轻扣住他的手，像是在邀请他再靠近一点。他停下来确认她的意思，得到回应后才吻了吻她。拥抱持续了很久，紧张、期待和安心交织在一起，剩下的亲密留在两人默契的停顿里。',
      '我会加强氛围、动作和情绪，而不写露骨的性行为细节。她靠近时，他先轻轻碰了碰她的额头，等她笑着主动吻回来，才把她温柔地揽进怀里。低声的调侃让两人都笑了，随后声音渐渐轻下来，亲密感在每一次停顿、回应和彼此确认中自然加深。'
    ], seed);
  }

  if (WRITING_PATTERN.test(text)) {
    return choose([
      '好，我们继续。接下来我会跟着前面的情境来回应，不重新开场，也不一次把整段说完。主人，你希望这一刻更温柔一点，还是更俏皮一点？',
      '嗯，情节接上了。我会留意人物的语气、刚才发生的事和你的下一句话，让互动自然推进。你来决定接下来怎么发展，我会认真回应。',
      '好呀，我们慢慢继续。保持一点暧昧、一点温柔，也留一点空间给你下一句，不用急着把所有情节一次说完。'
    ], seed);
  }

  return choose([
    '嗯，我在听呢，主人。你继续说，我会接着当前的情境回应，不会突然把话题打断。',
    '好呀，主人。今天我们就自然一点，想说什么就说什么，我会跟着你的语气继续聊。',
    '我听见啦。我们可以慢慢来，让每一句回应都接得上前面的话，也给下一句留一点空间。',
    '嗯哼，主人接着说吧。我会记住刚才的气氛，尽量用不一样的方式回应你。'
  ], seed);
}

module.exports = { isAdultCreativeRequest, composeAdultLayerReply, buildAdultCreativeMessages };
