
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import flexMessageGenerator
if "require('./flexMessageGenerator')" not in content:
    import_line = "const { createStatsDashboard, createCalculationDashboard } = require('./flexMessageGenerator');"
    # Add it after other requires
    content = content.replace("const { GoogleGenerativeAI } = require(\"@google/generative-ai\");", 
                              "const { GoogleGenerativeAI } = require(\"@google/generative-ai\");\n" + import_line)
    print("Added import")

# 2. Initialize pendingFlexMessages
# Find start of handleMessageEvent
start_fn = "async function handleMessageEvent(event, executionId) {"
if "let pendingFlexMessages = [];" not in content:
    content = content.replace(start_fn, start_fn + "\n  let pendingFlexMessages = [];")
    print("Added pendingFlexMessages init")

# 3. Update getSystemStats to generate Flex Message
# Find the block
stats_block = """            if (call.name === "getSystemStats") {
              functionResult = {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                nodeVersion: process.version,
                timestamp: new Date().toISOString()
              };"""

new_stats_block = """            if (call.name === "getSystemStats") {
              functionResult = {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                nodeVersion: process.version,
                timestamp: new Date().toISOString()
              };
              // Generate Flex Message
              try {
                const flexMsg = createStatsDashboard(functionResult);
                pendingFlexMessages.push(flexMsg);
              } catch (e) { console.error('Error generating stats dashboard:', e); }
              """

if stats_block in content:
    content = content.replace(stats_block, new_stats_block)
    print("Updated getSystemStats")

# 4. Add displayCalculationResult tool for Regular Users
# Find the else block for Regular User Prompt
reg_user_marker = "// 👤 REGULAR USER PROMPT: Enhanced Injection Molding Expert, Education & Agriculture"
# We need to find where `systemPrompt` ends and add `tools = [...]`

# The code looks like:
# systemPrompt = `...`;
# // ...
# }

# Let's find the end of systemPrompt assignment
prompt_end_marker = "${TECHMATION_KNOWLEDGE_PROMPT}`;"

tools_def = """
      // 🛠️ Define Tools for Regular User (Calculation Dashboard)
      tools = [
        {
          functionDeclarations: [
            {
              name: "displayCalculationResult",
              description: "Display calculation results in a beautiful dashboard card. Use this whenever you perform a calculation.",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING", description: "Title of the calculation (e.g., Cooling Time Result)" },
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: { type: "STRING" },
                        value: { type: "STRING" },
                        unit: { type: "STRING" }
                      }
                    }
                  },
                  recommendation: { type: "STRING", description: "Brief recommendation or summary" }
                },
                required: ["title", "data", "recommendation"]
              }
            }
          ]
        }
      ];
"""

if prompt_end_marker in content and "displayCalculationResult" not in content:
    # We need to be careful. The prompt_end_marker is inside the else block.
    # We can append tools definition after it.
    content = content.replace(prompt_end_marker, prompt_end_marker + tools_def)
    print("Added displayCalculationResult tool definition")

# 5. Handle displayCalculationResult execution
# Find the loop for function calls
# It has `} else if (call.name === "testInternalFunction") {`
# We can add another else if after it.

test_fn_block = """                } else {
                  functionResult = "Error: Function not exposed for testing";
                }
              } catch (e) {
                functionResult = `Error executing ${functionName}: ${e.message}`;
              }
            }"""

new_calc_handler = """            } else if (call.name === "displayCalculationResult") {
              const { title, data, recommendation } = call.args;
              try {
                const flexMsg = createCalculationDashboard(title, data, recommendation);
                pendingFlexMessages.push(flexMsg);
                functionResult = "Dashboard displayed to user.";
              } catch (e) {
                functionResult = `Error generating dashboard: ${e.message}`;
              }
            }"""

if test_fn_block in content and "displayCalculationResult" not in content[content.find("async function handleMessageEvent"): ]: 
    # We need to insert it.
    # The structure is:
    # if (call.name === "getSystemStats") { ... }
    # else if (call.name === "testInternalFunction") { ... }
    # 
    # We want to add else if (call.name === "displayCalculationResult") { ... }
    
    # Let's replace the closing brace of testInternalFunction block
    # Actually, let's look for the end of the loop or the next block.
    
    # The code is:
    # } else if (call.name === "testInternalFunction") {
    #    ...
    # }
    # 
    # functionResponses.push(...)
    
    # Let's find `functionResponses.push` and insert before it.
    push_marker = "functionResponses.push({"
    
    # We need to make sure we are inside the loop.
    # The loop starts with `for (const call of functionCalls) {`
    
    # Let's try to replace the end of testInternalFunction block.
    # It ends with `}` before `functionResponses.push`.
    
    # Let's use a larger context to be safe.
    context_str = """              } catch (e) {
                functionResult = `Error executing ${functionName}: ${e.message}`;
              }
            }"""
            
    if context_str in content:
        content = content.replace(context_str, context_str + "\n" + new_calc_handler)
        print("Added displayCalculationResult handler")

# 6. Send pendingFlexMessages
# Find where replyMessage is called.
# `await lineClient.replyMessage(replyToken, replyMessage);`

reply_marker = """    const replyMessage = {
      type: 'text',
      text: responseText
    };

    await lineClient.replyMessage(replyToken, replyMessage);"""

new_reply_logic = """    // Construct Reply Messages (Text + Flex)
    const messagesToSend = [];
    
    // Add Text Message
    messagesToSend.push({
      type: 'text',
      text: responseText
    });

    // Add Pending Flex Messages (Max 4 more, total 5)
    if (pendingFlexMessages.length > 0) {
      messagesToSend.push(...pendingFlexMessages.slice(0, 4));
    }

    await lineClient.replyMessage(replyToken, messagesToSend);"""

if reply_marker in content:
    content = content.replace(reply_marker, new_reply_logic)
    print("Updated reply logic to send Flex Messages")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
