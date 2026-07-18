            (function () {
                let pillMuted = false;
                let notifCount = 0;
                let chatCount = 0;

                window.setPillNotifCount = function (count) {
                    notifCount = count;
                    updatePillUI();
                };

                window.setPillChatCount = function (count) {
                    chatCount = count;
                    updatePillUI();
                };

                function updatePillUI() {
                    const pill = document.getElementById('notifMutePill');
                    const badge = document.getElementById('pillBadge');
                    const badgeExp = document.getElementById('pillBadgeExp');
                    const bellIcon = document.getElementById('pillBellIcon');
                    const bellIconExp = document.getElementById('pillBellIconExp');
                    const notifBtn = document.getElementById('pillNotifBtn');
                    const notifText = document.getElementById('pillNotifText');

                    const chatBadge = document.getElementById('pillChatBadge');
                    const chatBadgeExp = document.getElementById('pillChatBadgeExp');
                    const chatIcon = document.getElementById('pillChatIcon');
                    const chatIconExp = document.getElementById('pillChatIconExp');
                    const chatBtn = document.getElementById('pillChatBtn');
                    const chatText = document.getElementById('pillChatText');

                    const muteBtn = document.getElementById('pillMuteBtn');
                    const muteIconExp = document.getElementById('pillMuteIconExp');
                    const muteIcon = document.getElementById('pillMuteIcon');
                    const muteText = document.getElementById('pillMuteText');

                    // Pill Container state
                    if (pill) {
                        if (notifCount > 0 || chatCount > 0) pill.classList.add('has-notif');
                        else pill.classList.remove('has-notif');
                    }

                    // Notification Badge
                    if (notifCount > 0) {
                        const label = notifCount > 99 ? '99+' : String(notifCount);
                        if (badge) { badge.textContent = label; badge.style.display = 'flex'; }
                        if (badgeExp) { badgeExp.textContent = label; badgeExp.style.display = 'flex'; }
                        if (bellIcon) bellIcon.style.color = '#ff4d4d';
                        if (bellIconExp) bellIconExp.style.color = '#ff4d4d';
                        if (notifBtn) { notifBtn.classList.add('has-notif'); }
                        if (notifText) notifText.textContent = 'แจ้งเตือน ' + notifCount;
                    } else {
                        if (badge) badge.style.display = 'none';
                        if (badgeExp) badgeExp.style.display = 'none';
                        if (bellIcon) bellIcon.style.color = 'rgba(255,255,255,0.75)';
                        if (bellIconExp) bellIconExp.style.color = 'rgba(255,255,255,0.75)';
                        if (notifBtn) notifBtn.classList.remove('has-notif');
                        if (notifText) notifText.textContent = 'แจ้งเตือน';
                    }

                    // Chat Badge
                    if (chatCount > 0) {
                        const label = chatCount > 99 ? '99+' : String(chatCount);
                        if (chatBadge) { chatBadge.textContent = label; chatBadge.style.display = 'flex'; }
                        if (chatBadgeExp) { chatBadgeExp.textContent = label; chatBadgeExp.style.display = 'flex'; }
                        if (chatIcon) chatIcon.style.color = '#6366f1';
                        if (chatIconExp) chatIconExp.style.color = '#6366f1';
                        if (chatBtn) { chatBtn.classList.add('has-chat'); }
                        if (chatText) chatText.textContent = 'แชท ' + chatCount;
                    } else {
                        if (chatBadge) chatBadge.style.display = 'none';
                        if (chatBadgeExp) chatBadgeExp.style.display = 'none';
                        if (chatIcon) chatIcon.style.color = 'rgba(255,255,255,0.75)';
                        if (chatIconExp) chatIconExp.style.color = 'rgba(255,255,255,0.75)';
                        if (chatBtn) chatBtn.classList.remove('has-chat');
                        if (chatText) chatText.textContent = 'แชท';
                    }

                    // Mute
                    if (muteIcon) {
                        muteIcon.className = pillMuted ? 'fas fa-volume-mute pill-mute-icon' : 'fas fa-volume-up pill-mute-icon';
                        muteIcon.style.color = pillMuted ? 'rgba(255,255,255,0.35)' : '#00F2EA';
                    }
                    if (muteIconExp) muteIconExp.className = pillMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
                    if (muteText) muteText.textContent = pillMuted ? 'ปิดเสียง' : 'เปิดเสียง';
                    if (muteBtn) {
                        if (pillMuted) muteBtn.classList.add('muted');
                        else muteBtn.classList.remove('muted');
                    }
                }

                // ── Notification Island Controls ──
                window.toggleNotifMutePill = function (e) {
                    e.stopPropagation();
                    const pill = document.getElementById('notifMutePill');
                    pill.classList.toggle('expanded');
                };

                // Close pill if clicked outside
                document.addEventListener('click', () => {
                    const pill = document.getElementById('notifMutePill');
                    if (pill && pill.classList.contains('expanded')) {
                        pill.classList.remove('expanded');
                    }
                });

                window.switchHubTab = function (tab) {
                    const notifs = document.getElementById('hubContentNotifs');
                    const messages = document.getElementById('hubContentMessages');
                    const tabNotifs = document.getElementById('hubTabNotifs');
                    const tabMessages = document.getElementById('hubTabMessages');

                    if (tab === 'notifs') {
                        if (notifs) notifs.style.display = 'block';
                        if (messages) messages.style.display = 'none';
                        if (tabNotifs) tabNotifs.classList.add('active');
                        if (tabMessages) tabMessages.classList.remove('active');
                    } else {
                        if (notifs) notifs.style.display = 'none';
                        if (messages) messages.style.display = 'block';
                        if (tabNotifs) tabNotifs.classList.remove('active');
                        if (tabMessages) tabMessages.classList.add('active');
                        // Load conversations if switched to messages
                        initChatHub();
                    }
                };

                window.handlePillNotifClick = function (e) {
                    e.stopPropagation();
                    const pill = document.getElementById('notifMutePill');
                    if (pill) pill.classList.remove('expanded');
                    switchHubTab('notifs');
                    if (typeof toggleNotifications === 'function') toggleNotifications();
                };

                window.handlePillChatClick = function (e) {
                    e.stopPropagation();
                    const pill = document.getElementById('notifMutePill');
                    if (pill) pill.classList.remove('expanded');
                    if (typeof openInChat === 'function') openInChat();
                };

                // Listener for chat messages in Hub
                function initChatHub() {
                    const user = WizmobizAuth.getUser();
                    if (!user || typeof TukTukChat === 'undefined') return;
                    const userId = user.uid || user.lineUserId;
                    const chatList = document.getElementById('chatHubList');

                    TukTukChat.listenConversations(userId, (convs) => {
                        if (!convs.length) return;
                        let html = '';
                        let totalUnread = 0;
                        convs.forEach(c => {
                            const otherParticipant = c.participants.find(p => p !== userId);
                            const unread = c[`unreadCount_${userId}`] || 0;
                            totalUnread += unread;
                            html += `
                            <div class="notif-item ${unread > 0 ? 'unread' : 'read'}" onclick="if(typeof openInChat==='function'){openInChat();icOpenThread('${c.id}','conversations','${otherParticipant.substring(0, 8)}...',undefined,undefined);}else{window.location.href='messages.html?id=${c.id}&type=conv';}">
                                <div class="notif-icon" style="background: linear-gradient(135deg,#6366f1,#8b5cf6);">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="notif-content">
                                    <div class="notif-title">บทสนทนา: ${otherParticipant.substring(0, 8)}...</div>
                                    <div class="notif-text">${c.lastMessage || 'ส่งรูปภาพหรือไฟล์'}</div>
                                    <div class="notif-time">${unread > 0 ? `<b>${unread} ข้อความใหม่</b>` : 'อ่านแล้ว'}</div>
                                </div>
                            </div>
                        `;
                        });
                        if (chatList) chatList.innerHTML = html;
                        if (window.updatePillChatCount) window.updatePillChatCount(totalUnread);
                    });
                }

                window.handleMuteClick = function (e) {
                    e.stopPropagation();
                    pillMuted = !pillMuted;
                    updatePillUI();
                    if (typeof toggleTuktukGlobalMute === 'function') toggleTuktukGlobalMute(e);
                    const pill = document.getElementById('notifMutePill');
                    if (pill) pill.classList.remove('expanded');
                };

                // Expose function to update notification count from outside
                window.updatePillNotifCount = function (count) {
                    notifCount = count;
                    updatePillUI();
                };

                // Expose function to update chat count from outside
                window.updatePillChatCount = function (count) {
                    chatCount = count;
                    updatePillUI();
                };

                // Init
                document.addEventListener('DOMContentLoaded', () => {
                    updatePillUI();
                    initChatHub();
                });
            })();
