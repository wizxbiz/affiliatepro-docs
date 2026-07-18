/**
 * 🎨 ENHANCED ADMIN FLEX MESSAGES
 * Flex Messages สำหรับ Enhanced Admin Commands
 */

/**
 * Create Users List Flex Message
 * สำหรับ /users all
 */
const createUsersListFlex = (users, stats) => {
  const userItems = users.slice(0, 20).map((user, index) => {
    const statusIcon = user.isPremium ? "💎" : (user.trialStatus === "active" ? "🆓" : "👤");
    const bannedIcon = user.banned ? "🚫 " : "";
    const activeIcon = user.isActive ? "🟢" : "⚫";
    const lineIcon = user.fromLINE ? "📱" : "❌"; // แสดงว่ายังติดตาม OA หรือไม่

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: `${statusIcon}${bannedIcon}`, size: "md", flex: 0},
                {type: "text", text: user.displayName || "No name", size: "sm", color: "#1f2937", weight: "bold", margin: "sm", flex: 1, wrap: true},
                {type: "text", text: `${lineIcon} ${activeIcon}`, size: "xs", flex: 0},
              ],
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: `ID: ${user.id}`, size: "xxs", color: "#6b7280", wrap: true},
                {type: "text", text: `Joined: ${user.createdAt || "N/A"}`, size: "xxs", color: "#9ca3af", margin: "xs"},
              ],
              margin: "xs",
            },
          ],
          flex: 1,
        },
      ],
      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
      paddingAll: "10px",
      margin: index === 0 ? "none" : "xs",
      action: {type: "message", label: "View Details", text: `/user ${user.id}`},
    };
  });

  return {
    type: "flex",
    altText: `👥 Users List (${stats.total || users.length})`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "👥", size: "3xl", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "All Users", weight: "bold", size: "xl", color: "#ffffff"},
                  {type: "text", text: `Total: ${stats.total || users.length} users`, size: "xs", color: "#ffffff99", margin: "xs"},
                ],
                margin: "md",
              },
            ],
          },
          // Stats Bar
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {type: "text", text: "💎", size: "xs"},
                  {type: "text", text: `${stats.premium}`, size: "xs", color: "#ffffff", margin: "xs"},
                ],
                flex: 1,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {type: "text", text: "🆓", size: "xs"},
                  {type: "text", text: `${stats.trial}`, size: "xs", color: "#ffffff", margin: "xs"},
                ],
                flex: 1,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {type: "text", text: "🚫", size: "xs"},
                  {type: "text", text: `${stats.banned}`, size: "xs", color: "#ffffff", margin: "xs"},
                ],
                flex: 1,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {type: "text", text: "🟢", size: "xs"},
                  {type: "text", text: `${stats.online}`, size: "xs", color: "#ffffff", margin: "xs"},
                ],
                flex: 1,
              },
            ],
            margin: "lg",
          },
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#f59e0b",
          endColor: "#d97706",
        },
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          ...userItems,
        ],
        paddingAll: "0px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "🔍 Search", text: "/user search"},
                style: "primary",
                color: "#f59e0b",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {type: "message", label: "📊 Analytics", text: "/analytics users"},
                style: "link",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {type: "text", text: "💡", size: "xs"},
              {type: "text", text: "Click on user to view details", size: "xxs", color: "#6b7280", margin: "sm"},
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
};

/**
 * Create Analytics Users Flex Message
 * สำหรับ /analytics users
 */
const createAnalyticsUsersFlex = (stats) => {
  const engagementRate = stats.total > 0 ? ((stats.active7Days / stats.total) * 100).toFixed(1) : 0;
  const growthRate = stats.new7Days > 0 ? ((stats.newToday / stats.new7Days) * 7 * 100).toFixed(1) : 0;

  return {
    type: "flex",
    altText: "📊 User Analytics",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "📊", size: "3xl", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "User Analytics", weight: "bold", size: "xl", color: "#ffffff"},
                  {type: "text", text: "Comprehensive insights", size: "xs", color: "#ffffff99", margin: "xs"},
                ],
                margin: "md",
              },
            ],
          },
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#6366f1",
          endColor: "#4f46e5",
        },
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Overview Cards
          {type: "text", text: "👥 User Overview", weight: "bold", size: "sm", color: "#1f2937"},
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: stats.total.toLocaleString(), size: "xxl", weight: "bold", color: "#6366f1", align: "center"},
                  {type: "text", text: "Total", size: "xs", color: "#6b7280", align: "center", margin: "xs"},
                ],
                flex: 1,
                backgroundColor: "#eff6ff",
                cornerRadius: "10px",
                paddingAll: "12px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: stats.premium.toString(), size: "xxl", weight: "bold", color: "#8b5cf6", align: "center"},
                  {type: "text", text: "Premium", size: "xs", color: "#6b7280", align: "center", margin: "xs"},
                ],
                flex: 1,
                backgroundColor: "#faf5ff",
                cornerRadius: "10px",
                paddingAll: "12px",
                margin: "sm",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: stats.trial.toString(), size: "xxl", weight: "bold", color: "#10b981", align: "center"},
                  {type: "text", text: "Trial", size: "xs", color: "#6b7280", align: "center", margin: "xs"},
                ],
                flex: 1,
                backgroundColor: "#ecfdf5",
                cornerRadius: "10px",
                paddingAll: "12px",
                margin: "sm",
              },
            ],
            margin: "sm",
          },

          {type: "separator", margin: "lg"},

          // Activity Stats
          {type: "text", text: "📈 Activity Trends", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "Today", size: "sm", color: "#4b5563", flex: 1},
                  {type: "text", text: stats.activeToday.toString(), size: "sm", color: "#10b981", weight: "bold", align: "end"},
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "7 Days", size: "sm", color: "#4b5563", flex: 1},
                  {type: "text", text: stats.active7Days.toString(), size: "sm", color: "#10b981", weight: "bold", align: "end"},
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "30 Days", size: "sm", color: "#4b5563", flex: 1},
                  {type: "text", text: stats.active30Days.toString(), size: "sm", color: "#10b981", weight: "bold", align: "end"},
                ],
                margin: "sm",
              },
            ],
            backgroundColor: "#f9fafb",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm",
          },

          {type: "separator", margin: "lg"},

          // New Users & Metrics
          {type: "text", text: "🆕 Growth Metrics", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {type: "text", text: stats.newToday.toString(), size: "xl", weight: "bold", color: "#3b82f6", flex: 0},
                      {type: "text", text: "/ day", size: "xs", color: "#6b7280", margin: "sm"},
                    ],
                    justifyContent: "center",
                  },
                  {type: "text", text: "New Today", size: "xs", color: "#6b7280", align: "center", margin: "xs"},
                ],
                flex: 1,
                backgroundColor: "#eff6ff",
                cornerRadius: "8px",
                paddingAll: "10px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {type: "text", text: stats.new7Days.toString(), size: "xl", weight: "bold", color: "#10b981", flex: 0},
                      {type: "text", text: "/ week", size: "xs", color: "#6b7280", margin: "sm"},
                    ],
                    justifyContent: "center",
                  },
                  {type: "text", text: "New 7 Days", size: "xs", color: "#6b7280", align: "center", margin: "xs"},
                ],
                flex: 1,
                backgroundColor: "#ecfdf5",
                cornerRadius: "8px",
                paddingAll: "10px",
                margin: "sm",
              },
            ],
            margin: "sm",
          },

          {type: "separator", margin: "lg"},

          // Key Metrics
          {type: "text", text: "🎯 Key Metrics", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: `${engagementRate}%`, size: "xxl", weight: "bold", color: "#8b5cf6", align: "center"},
                  {type: "text", text: "Engagement", size: "xs", color: "#6b7280", align: "center", margin: "xs"},
                ],
                flex: 1,
                backgroundColor: "#faf5ff",
                cornerRadius: "10px",
                paddingAll: "12px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: stats.banned.toString(), size: "xxl", weight: "bold", color: "#ef4444", align: "center"},
                  {type: "text", text: "Banned", size: "xs", color: "#6b7280", align: "center", margin: "xs"},
                ],
                flex: 1,
                backgroundColor: "#fef2f2",
                cornerRadius: "10px",
                paddingAll: "12px",
                margin: "sm",
              },
            ],
            margin: "sm",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "👥 View Users", text: "/users all"},
                style: "primary",
                color: "#6366f1",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {type: "message", label: "📊 Dashboard", text: "/superadmin enhanced"},
                style: "link",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "15px",
      },
    },
  };
};

/**
 * Create AI Config Flex Message
 * สำหรับ /ai config
 */
const createAIConfigFlex = (config) => {
  const statusColor = config.enabled ? "#10b981" : "#ef4444";
  const statusText = config.enabled ? "Enabled" : "Disabled";

  return {
    type: "flex",
    altText: "⚙️ AI Configuration",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "⚙️", size: "3xl", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "AI Configuration", weight: "bold", size: "xl", color: "#ffffff"},
                  {type: "text", text: "Current settings", size: "xs", color: "#ffffff99", margin: "xs"},
                ],
                margin: "md",
              },
            ],
          },
          // Status Badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {type: "text", text: "●", size: "sm", color: statusColor},
                  {type: "text", text: statusText, size: "sm", color: "#ffffff", weight: "bold", margin: "sm"},
                ],
                backgroundColor: config.enabled ? "#10b98130" : "#ef444430",
                cornerRadius: "20px",
                paddingAll: "8px",
                paddingStart: "12px",
                paddingEnd: "12px",
              },
            ],
            margin: "lg",
          },
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#8b5cf6",
          endColor: "#7c3aed",
        },
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Model Settings
          {type: "text", text: "🤖 Model Settings", weight: "bold", size: "sm", color: "#1f2937"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "Model", size: "sm", color: "#6b7280", flex: 1},
                  {type: "text", text: config.model || "gemini-pro", size: "sm", color: "#1f2937", weight: "bold", align: "end", flex: 2},
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "Temperature", size: "sm", color: "#6b7280", flex: 1},
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "text", text: (config.temperature || 0.7).toString(), size: "sm", color: "#1f2937", weight: "bold"},
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [],
                        width: `${(config.temperature || 0.7) * 100}%`,
                        height: "6px",
                        backgroundColor: "#8b5cf6",
                        cornerRadius: "3px",
                        margin: "sm",
                      },
                    ],
                    flex: 2,
                  },
                ],
                margin: "md",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "Max Tokens", size: "sm", color: "#6b7280", flex: 1},
                  {type: "text", text: (config.maxTokens || 2048).toLocaleString(), size: "sm", color: "#1f2937", weight: "bold", align: "end", flex: 2},
                ],
                margin: "md",
              },
            ],
            backgroundColor: "#f9fafb",
            cornerRadius: "10px",
            paddingAll: "15px",
            margin: "sm",
          },

          {type: "separator", margin: "lg"},

          // Advanced Settings
          {type: "text", text: "🎛️ Advanced Settings", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "Top-P", size: "xs", color: "#6b7280", align: "center"},
                      {type: "text", text: (config.topP || 0.9).toString(), size: "xl", weight: "bold", color: "#6366f1", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#eff6ff",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "Top-K", size: "xs", color: "#6b7280", align: "center"},
                      {type: "text", text: (config.topK || 40).toString(), size: "xl", weight: "bold", color: "#8b5cf6", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#faf5ff",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                  },
                ],
              },
            ],
            margin: "sm",
          },

          {type: "separator", margin: "lg"},

          // Info Box
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "💡", size: "lg", flex: 0},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "Configuration Info", size: "xs", weight: "bold", color: "#1f2937"},
                      {type: "text", text: "Temperature controls randomness (0-1)", size: "xxs", color: "#6b7280", margin: "xs", wrap: true},
                      {type: "text", text: "Top-P/Top-K control diversity", size: "xxs", color: "#6b7280", margin: "xs", wrap: true},
                    ],
                    margin: "sm",
                  },
                ],
              },
            ],
            backgroundColor: "#fef3c7",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "lg",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "🎯 View Strategy", text: "/ai strategy"},
            style: "primary",
            color: "#8b5cf6",
            height: "sm",
          },
          {
            type: "button",
            action: {type: "message", label: "📝 Manage Prompts", text: "/ai prompts"},
            style: "link",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
};

/**
 * Create AI Strategy Flex Message
 * สำหรับ /ai strategy
 */
const createAIStrategyFlex = (strategy) => {
  const strategies = [
    {name: "Local Primary", key: "local_primary", icon: "📚", color: "#10b981", threshold: strategy.localConfidenceThreshold},
    {name: "AI Primary", key: "ai_primary", icon: "🤖", color: "#3b82f6", threshold: strategy.aiConfidenceThreshold},
    {name: "Balanced Hybrid", key: "balanced_hybrid", icon: "⚖️", color: "#8b5cf6", threshold: strategy.balancedThreshold},
  ];

  const defaultStrategy = strategies.find((s) => s.key === strategy.defaultStrategy) || strategies[2];

  return {
    type: "flex",
    altText: "🎯 Hybrid Strategy",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "🎯", size: "3xl", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "Hybrid Strategy", weight: "bold", size: "xl", color: "#ffffff"},
                  {type: "text", text: "AI decision-making rules", size: "xs", color: "#ffffff99", margin: "xs"},
                ],
                margin: "md",
              },
            ],
          },
          // Default Strategy Badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {type: "text", text: defaultStrategy.icon, size: "sm"},
                  {type: "text", text: `Default: ${defaultStrategy.name}`, size: "sm", color: "#ffffff", weight: "bold", margin: "sm"},
                ],
                backgroundColor: `${defaultStrategy.color}40`,
                cornerRadius: "20px",
                paddingAll: "8px",
                paddingStart: "12px",
                paddingEnd: "12px",
              },
            ],
            margin: "lg",
          },
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#6366f1",
          endColor: "#8b5cf6",
        },
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Strategy Cards
          {type: "text", text: "📊 Strategy Thresholds", weight: "bold", size: "sm", color: "#1f2937"},
          ...strategies.map((s, index) => ({
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: s.icon, size: "xl", flex: 0},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: s.name, size: "sm", weight: "bold", color: "#1f2937"},
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          {type: "text", text: `Threshold: ${s.threshold}`, size: "xs", color: "#6b7280", flex: 1},
                          {type: "text", text: `${(s.threshold * 100).toFixed(0)}%`, size: "xs", color: s.color, weight: "bold", align: "end"},
                        ],
                        margin: "xs",
                      },
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          {
                            type: "box",
                            layout: "vertical",
                            contents: [],
                            width: `${s.threshold * 100}%`,
                            height: "8px",
                            backgroundColor: s.color,
                            cornerRadius: "4px",
                          },
                        ],
                        backgroundColor: "#e5e7eb",
                        height: "8px",
                        cornerRadius: "4px",
                        margin: "sm",
                      },
                    ],
                    margin: "md",
                  },
                ],
              },
            ],
            backgroundColor: index === strategies.findIndex((x) => x.key === strategy.defaultStrategy) ? `${s.color}10` : "#f9fafb",
            cornerRadius: "10px",
            paddingAll: "15px",
            margin: index === 0 ? "sm" : "md",
            borderWidth: index === strategies.findIndex((x) => x.key === strategy.defaultStrategy) ? "2px" : "0px",
            borderColor: s.color,
          })),

          {type: "separator", margin: "lg"},

          // Settings
          {type: "text", text: "⚙️ Additional Settings", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "🔄 Fallback Mode", size: "sm", color: "#4b5563", flex: 1},
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {type: "text", text: strategy.enableFallback ? "●" : "○", size: "sm", color: strategy.enableFallback ? "#10b981" : "#ef4444"},
                      {type: "text", text: strategy.enableFallback ? "Enabled" : "Disabled", size: "sm", color: strategy.enableFallback ? "#10b981" : "#ef4444", weight: "bold", margin: "sm"},
                    ],
                  },
                ],
              },
            ],
            backgroundColor: "#f9fafb",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm",
          },

          {type: "separator", margin: "lg"},

          // Info
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "💡", size: "lg", flex: 0},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "How it works", size: "xs", weight: "bold", color: "#1f2937"},
                      {type: "text", text: "Higher threshold = More confident before using strategy", size: "xxs", color: "#6b7280", margin: "xs", wrap: true},
                      {type: "text", text: "Fallback: Use best effort when no strategy matches", size: "xxs", color: "#6b7280", margin: "xs", wrap: true},
                    ],
                    margin: "sm",
                  },
                ],
              },
            ],
            backgroundColor: "#eff6ff",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "lg",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "📊 Performance", text: "/analytics ai"},
                style: "primary",
                color: "#6366f1",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {type: "message", label: "⚙️ Config", text: "/ai config"},
                style: "link",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "15px",
      },
    },
  };
};

module.exports = {
  createUsersListFlex,
  createAnalyticsUsersFlex,
  createAIConfigFlex,
  createAIStrategyFlex,
};
