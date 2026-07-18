

export async function checkAndSendVideoMilestones(env) {
  try {
    const db = env.DB;
    const kv = env.SESSIONS;
    const channelToken = env.TUKTUK_CHANNEL_ACCESS_TOKEN || env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelToken) {
      console.warn('[Broadcast] No channel token configured');
      return;
    }

    // ค้นหาวิดีโอที่ยัง Active และมียอดวิวทะลุ 100
    // เช็คว่ามีวิดีโอจาก media_urls, youtube_url หรือ video_embed
    const query = `
      SELECT p.*, u.line_user_id 
      FROM posts p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.status = 'active' 
      AND p.views_count >= 100
      AND (
        COALESCE(p.media_urls, '') LIKE '%video%'
        OR COALESCE(p.media_urls, '') LIKE '%.mp4%'
        OR COALESCE(p.media_urls, '') LIKE '%.webm%'
        OR COALESCE(p.youtube_url, '') != ''
        OR COALESCE(p.video_embed, '') != ''
      )
      ORDER BY p.views_count DESC
      LIMIT 50
    `;
    const { results } = await db.prepare(query).all();

    for (const post of results) {
      const views = post.views_count;
      const postId = post.id;
      const creatorLineId = post.line_user_id;

      // 1. คลิปตัวเอง 100+ -> แจ้งเตือนคนเขียน (แจ้งแค่ครั้งเดียว)
      if (views >= 100 && views < 1000 && creatorLineId) {
        const kvKey100 = `milestone:post:${postId}:100`;
        const already100 = await kv.get(kvKey100);
        if (!already100) {
          const msg = buildMilestoneMessage(post, 100);
          await pushLineMessage(creatorLineId, [msg], channelToken);
          await kv.put(kvKey100, 'true', { expirationTtl: 60 * 60 * 24 * 365 }); // บันทึก 1 ปี
          console.log(`[Broadcast] Sent 100 views milestone to creator for post ${postId}`);
        }
      }

      // 2. คลิปทะลุ 1,000+ -> Broadcast ให้ทุกคนทราบ (แจ้งแค่ครั้งเดียว)
      if (views >= 1000) {
        const kvKey1000 = `milestone:post:${postId}:1000`;
        const already1000 = await kv.get(kvKey1000);
        if (!already1000) {
          const msg = buildMilestoneMessage(post, 1000);
          await broadcastLineMessage([msg], channelToken);
          await kv.put(kvKey1000, 'true', { expirationTtl: 60 * 60 * 24 * 365 });
          
          // ป้องกันการแจ้งเตือน 100 ซ้ำซ้อน หากยอดวิวกระโดดข้ามทีเดียว
          const kvKey100 = `milestone:post:${postId}:100`;
          await kv.put(kvKey100, 'true', { expirationTtl: 60 * 60 * 24 * 365 });
          
          console.log(`[Broadcast] Sent 1000 views broadcast for post ${postId}`);
        }
      }
    }
  } catch (err) {
    console.error('[Broadcast] Error in checkAndSendVideoMilestones:', err);
  }
}

function buildMilestoneMessage(post, milestone) {
  let title = post.title || post.content || 'คลิปวิดีโอจาก TukTuk Feed';
  title = String(title).replace(/<[^>]*>?/gm, '').trim();
  title = title.length > 40 ? title.substring(0, 40) + '...' : title;
  
  const url = `https://tuktukfeed.com/app/?post=${encodeURIComponent(post.id || '')}`;
  
  let imageUrl = 'https://placehold.co/800x1000/0F172A/ffffff?text=TukTuk+Video';
  if (post.product_thumb || post.thumbnail_url || post.image_url) {
    imageUrl = post.product_thumb || post.thumbnail_url || post.image_url;
  } else {
    try {
      const media = JSON.parse(post.media_urls || '[]');
      for (const item of media) {
        const itemUrl = typeof item === 'string' ? item : item?.url;
        if (typeof itemUrl === 'string' && itemUrl.startsWith('https://') && !itemUrl.endsWith('.mp4') && !itemUrl.endsWith('.webm')) {
          imageUrl = itemUrl;
          break;
        }
      }
    } catch (_) {}
  }

  // Sanitize URL for Flex (remove invisible chars, convert space)
  imageUrl = String(imageUrl).replace(/\\s/g, '%20').replace(/[\\x00-\\x1F\\x7F-\\x9F]/g, '').trim();

  if (milestone === 100) {
    return {
      type: "flex",
      altText: "ยินดีด้วย! คลิปของคุณมียอดวิวทะลุ 100 แล้ว 🎉",
      contents: {
        type: "bubble",
        size: "mega",
        body: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0F172A",
          contents: [
            { type: "text", text: "🎉 ยินดีด้วย!", weight: "bold", size: "xl", color: "#10B981" },
            { type: "text", text: "คลิปของคุณมียอดวิวทะลุ 100 วิวแล้ว", wrap: true, size: "sm", margin: "md", color: "#94A3B8" },
            { type: "text", text: `"${title}"`, wrap: true, margin: "md", weight: "bold", color: "#FFFFFF" }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0F172A",
          contents: [
            {
              type: "button",
              action: { type: "uri", label: "ดูคลิปของคุณ", uri: url },
              style: "primary",
              color: "#EC4899"
            }
          ]
        }
      }
    };
  } else {
    return {
      type: "flex",
      altText: "🔥 คลิปฮิตมาแรง! ทะลุ 1,000 วิวแล้ว",
      contents: {
        type: "bubble",
        size: "mega",
        hero: {
          type: "image",
          url: imageUrl,
          size: "full",
          aspectRatio: "4:5",
          aspectMode: "cover",
          action: { type: "uri", uri: url }
        },
        body: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0F172A",
          contents: [
            { type: "text", text: "🔥 คลิปฮิตมาแรง!", weight: "bold", size: "xl", color: "#F59E0B" },
            { type: "text", text: "มีคนดูทะลุ 1,000 วิวแล้ว ห้ามพลาด!", wrap: true, size: "sm", margin: "md", color: "#94A3B8" },
            { type: "text", text: `"${title}"`, wrap: true, margin: "md", weight: "bold", color: "#FFFFFF" }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0F172A",
          paddingAll: "16px",
          contents: [
            {
              type: "button",
              action: { type: "uri", label: "ดูคลิปเลย", uri: url },
              style: "primary",
              color: "#8B5CF6"
            }
          ]
        }
      }
    };
  }
}

async function pushLineMessage(lineUserId, messages, channelToken) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: messages
    })
  });
  if (!response.ok) {
    const err = await response.text();
    console.error(`[LINE Push Error] Status ${response.status}: ${err}`);
  }
}

async function broadcastLineMessage(messages, channelToken) {
  const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelToken}`,
    },
    body: JSON.stringify({
      messages: messages
    })
  });
  if (!response.ok) {
    const err = await response.text();
    console.error(`[LINE Broadcast Error] Status ${response.status}: ${err}`);
  }
}
