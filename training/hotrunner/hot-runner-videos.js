/**
 * hot-runner-videos.js
 * ไฟล์นี้ใช้สำหรับการจัดการวิดีโอในสื่อการสอน Hot Runner Mold System
 */

// รายการวิดีโอที่มีอยู่ในระบบ
const videoDatabase = {
    // วิดีโอแสดงการทำงาน
    operation: [
        {
            id: 'op-valve-gate',
            title: 'การทำงานของ Valve Gate System',
            path: 'videos/valve-gate-operation.mp4',
            thumbnail: 'videos/thumbnails/valve-gate-operation.jpg',
            description: 'วิดีโอนี้แสดงการทำงานของ Valve Gate Hot Runner System ซึ่งใช้เข็มควบคุมการไหลของพลาสติก'
        },
        {
            id: 'op-thermal-gate', 
            title: 'การทำงานของ Thermal Gate System',
            path: 'videos/thermal-gate-operation.mp4',
            thumbnail: 'videos/thumbnails/thermal-gate-operation.jpg',
            description: 'วิดีโอนี้แสดงการทำงานของ Thermal Gate Hot Runner System ซึ่งควบคุมการไหลด้วยอุณหภูมิ'
        },
        {
            id: 'op-open-tip',
            title: 'การทำงานของ Open Tip System',
            path: 'videos/open-tip-operation.mp4',
            thumbnail: 'videos/thumbnails/open-tip-operation.jpg',
            description: 'วิดีโอนี้แสดงการทำงานของ Open Tip Hot Runner System ซึ่งเป็นระบบที่พลาสติกไหลผ่านโดยตรง'
        }
    ],
    
    // วิดีโอแสดงการติดตั้ง
    installation: [
        {
            id: 'install-standard',
            title: 'การติดตั้ง Hot Runner System ทั่วไป',
            path: 'videos/standard-installation.mp4',
            thumbnail: 'videos/thumbnails/standard-installation.jpg',
            description: 'วิดีโอนี้แสดงขั้นตอนการติดตั้งระบบ Hot Runner เข้ากับแม่พิมพ์ การต่อระบบควบคุมอุณหภูมิ และการตั้งค่าเริ่มต้น'
        },
        {
            id: 'install-manifold',
            title: 'การติดตั้ง Manifold',
            path: 'videos/manifold-installation.mp4',
            thumbnail: 'videos/thumbnails/manifold-installation.jpg',
            description: 'วิดีโอนี้แสดงขั้นตอนการติดตั้งแมนิโฟลด์ซึ่งเป็นส่วนประกอบสำคัญของระบบ Hot Runner'
        }
    ],
    
    // วิดีโอแสดงการบำรุงรักษา
    maintenance: [
        {
            id: 'maint-cleaning',
            title: 'การทำความสะอาด Hot Runner',
            path: 'videos/hot-runner-cleaning.mp4',
            thumbnail: 'videos/thumbnails/hot-runner-cleaning.mp4',
            description: 'วิดีโอนี้แนะนำวิธีการทำความสะอาดระบบ Hot Runner เพื่อป้องกันการอุดตันและยืดอายุการใช้งาน'
        },
        {
            id: 'maint-valve-pin',
            title: 'การบำรุงรักษา Valve Pin',
            path: 'videos/valve-pin-maintenance.mp4',
            thumbnail: 'videos/thumbnails/valve-pin-maintenance.jpg',
            description: 'วิดีโอนี้แสดงวิธีการบำรุงรักษาเข็มควบคุมการไหลใน Valve Gate System'
        }
    ],
    
    // วิดีโอแสดงการแก้ไขปัญหา
    troubleshooting: [
        {
            id: 'trouble-leakage',
            title: 'การแก้ไขปัญหาพลาสติกรั่วไหล',
            path: 'videos/leakage-fix.mp4',
            thumbnail: 'videos/thumbnails/leakage-fix.jpg',
            description: 'วิดีโอนี้แสดงการวินิจฉัยและแก้ไขปัญหาการรั่วไหลของพลาสติกในระบบ Hot Runner'
        },
        {
            id: 'trouble-heating',
            title: 'การแก้ไขปัญหาระบบทำความร้อน',
            path: 'videos/heating-issue-fix.mp4',
            thumbnail: 'videos/thumbnails/heating-issue-fix.jpg',
            description: 'วิดีโอนี้แสดงการวินิจฉัยและแก้ไขปัญหาเกี่ยวกับระบบทำความร้อนของ Hot Runner'
        }
    ]
};

// เมื่อโหลด DOM เสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', function() {
    // ตัวแปรสำหรับเก็บข้อมูลวิดีโอปัจจุบัน
    let currentVideoCategory = null;
    let currentVideoId = null;
    
    // เริ่มต้นการทำงาน
    initializeVideoSystem();
    
    /**
     * เริ่มต้นระบบการจัดการวิดีโอ
     */
    function initializeVideoSystem() {
        // จัดการการคลิกปุ่มเลือกประเภทวิดีโอ
        setupVideoCategoryButtons();
        
        // สร้างตัวแสดงรายการวิดีโอ
        createVideoListContainer();
        
        // เลือกประเภทวิดีโอแรกเป็นค่าเริ่มต้น (Operation)
        const firstVideoButton = document.querySelector('.video-button[data-video="operation"]');
        if (firstVideoButton) {
            firstVideoButton.click();
        }
    }
    
    /**
     * ตั้งค่าปุ่มเลือกประเภทวิดีโอ
     */
    function setupVideoCategoryButtons() {
        const videoButtons = document.querySelectorAll('.video-button');
        
        videoButtons.forEach(button => {
            button.addEventListener('click', function() {
                const videoType = this.getAttribute('data-video');
                
                // ยกเลิกการเลือกปุ่มทั้งหมด
                videoButtons.forEach(btn => btn.classList.remove('active'));
                
                // เลือกปุ่มที่คลิก
                this.classList.add('active');
                
                // บันทึกประเภทวิดีโอปัจจุบัน
                currentVideoCategory = videoType;
                
                // แสดงรายการวิดีโอตามประเภทที่เลือก
                displayVideoList(videoType);
                
                // อัปเดตคำอธิบายตามประเภทวิดีโอ
                updateVideoCategoryDescription(videoType);
            });
        });
    }
    
    /**
     * สร้างคอนเทนเนอร์สำหรับแสดงรายการวิดีโอ
     */
    function createVideoListContainer() {
        // หาคอนเทนเนอร์สำหรับแสดงวิดีโอ
        const videoContainer = document.querySelector('.video-container');
        if (!videoContainer) return;
        
        // สร้างองค์ประกอบสำหรับแสดงรายการวิดีโอ
        const videoListContainer = document.createElement('div');
        videoListContainer.id = 'video-list-container';
        videoListContainer.className = 'video-list-container';
        
        // สร้างองค์ประกอบสำหรับเล่นวิดีโอ
        const videoPlayerContainer = document.createElement('div');
        videoPlayerContainer.id = 'video-player-container';
        videoPlayerContainer.className = 'video-player-container';
        videoPlayerContainer.innerHTML = `
            <div class="video-placeholder">
                <i class="fas fa-video" style="font-size: 3em; margin-bottom: 20px; color: #555;"></i>
                <p>กรุณาเลือกวิดีโอที่ต้องการดูจากรายการด้านล่าง</p>
            </div>
        `;
        
        // เพิ่มองค์ประกอบเข้าไปในคอนเทนเนอร์
        videoContainer.innerHTML = '';
        videoContainer.appendChild(videoPlayerContainer);
        videoContainer.appendChild(videoListContainer);
        
        // เพิ่มสไตล์ CSS แบบอินไลน์
        const style = document.createElement('style');
        style.textContent = `
            .video-list-container {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-top: 20px;
            }
            
            .video-item {
                flex: 1 0 200px;
                max-width: 250px;
                cursor: pointer;
                border-radius: 8px;
                overflow: hidden;
                background-color: #f5f5f5;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .video-item:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .video-item.active {
                border: 3px solid var(--primary-color);
            }
            
            .video-thumbnail {
                width: 100%;
                height: 140px;
                background-color: #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            
            .video-thumbnail img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .video-thumbnail i {
                position: absolute;
                font-size: 3em;
                color: white;
                opacity: 0.8;
                background-color: rgba(0, 0, 0, 0.3);
                border-radius: 50%;
                padding: 10px;
            }
            
            .video-info {
                padding: 10px;
            }
            
            .video-info h4 {
                margin: 0 0 5px 0;
                font-size: 1em;
            }
            
            .video-player-container {
                width: 100%;
                height: 400px;
                background-color: #000;
                border-radius: 8px;
                overflow: hidden;
                position: relative;
            }
            
            .video-player-container video {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            
            .video-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background-color: #222;
                color: #fff;
                text-align: center;
                padding: 20px;
            }
            
            @media (max-width: 768px) {
                .video-item {
                    max-width: 100%;
                }
                
                .video-player-container {
                    height: 300px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * แสดงรายการวิดีโอตามประเภทที่เลือก
     * @param {string} videoType - ประเภทของวิดีโอ
     */
    function displayVideoList(videoType) {
        const videoListContainer = document.getElementById('video-list-container');
        if (!videoListContainer) return;
        
        // ล้างรายการวิดีโอเดิม
        videoListContainer.innerHTML = '';
        
        // ตรวจสอบว่ามีวิดีโอในประเภทนี้หรือไม่
        const videos = videoDatabase[videoType];
        if (!videos || videos.length === 0) {
            videoListContainer.innerHTML = '<p>ไม่พบวิดีโอในหมวดหมู่นี้</p>';
            return;
        }
        
        // สร้างรายการวิดีโอ
        videos.forEach(video => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.setAttribute('data-video-id', video.id);
            videoItem.setAttribute('aria-label', `เล่นวิดีโอ ${video.title}`);
            videoItem.setAttribute('tabindex', '0'); // ทำให้คลิกได้ด้วยแป้นพิมพ์
            
            // กำหนด HTML สำหรับรายการวิดีโอ
            videoItem.innerHTML = `
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='/api/placeholder/300/200'; this.onerror=null;">
                    <i class="fas fa-play-circle"></i>
                </div>
                <div class="video-info">
                    <h4>${video.title}</h4>
                </div>
            `;
            
            // เพิ่มการจัดการเหตุการณ์คลิก
            videoItem.addEventListener('click', function() {
                // ลบคลาส active จากทุกรายการ
                document.querySelectorAll('.video-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // เพิ่มคลาส active ให้กับรายการที่เลือก
                this.classList.add('active');
                
                // แสดงวิดีโอที่เลือก
                playVideo(video);
                
                // อัปเดตคำอธิบายวิดีโอ
                updateVideoDescription(video.description);
                
                // บันทึก ID ของวิดีโอปัจจุบัน
                currentVideoId = video.id;
            });
            
            // เพิ่มการจัดการเหตุการณ์กดคีย์บอร์ด
            videoItem.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.click();
                }
            });
            
            // เพิ่มรายการวิดีโอลงในคอนเทนเนอร์
            videoListContainer.appendChild(videoItem);
        });
        
        // เลือกวิดีโอแรกเป็นค่าเริ่มต้น
        const firstVideoItem = videoListContainer.querySelector('.video-item');
        if (firstVideoItem) {
            firstVideoItem.click();
        }
    }
    
    /**
     * เล่นวิดีโอที่เลือก
     * @param {Object} video - ข้อมูลวิดีโอที่จะเล่น
     */
    function playVideo(video) {
        const videoPlayerContainer = document.getElementById('video-player-container');
        if (!videoPlayerContainer) return;
        
        // สร้างองค์ประกอบวิดีโอ
        videoPlayerContainer.innerHTML = `
            <video controls autoplay>
                <source src="${video.path}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    }
    
    /**
     * อัปเดตคำอธิบายประเภทวิดีโอ
     * @param {string} videoType - ประเภทของวิดีโอ
     */
    function updateVideoCategoryDescription(videoType) {
        let description = '';
        switch(videoType) {
            case 'operation':
                description = 'วิดีโอนี้แสดงการทำงานของ Hot Runner System ตั้งแต่ขั้นตอนการหลอมละลายพลาสติก การไหลผ่านแมนิโฟลด์ และการฉีดเข้าสู่ช่องเบ้า';
                break;
            case 'installation':
                description = 'วิดีโอนี้แสดงขั้นตอนการติดตั้งระบบ Hot Runner เข้ากับแม่พิมพ์ การต่อระบบควบคุมอุณหภูมิ และการตั้งค่าเริ่มต้น';
                break;
            case 'maintenance':
                description = 'วิดีโอนี้แนะนำการบำรุงรักษาระบบ Hot Runner การทำความสะอาด การตรวจสอบการสึกหรอ และการเปลี่ยนชิ้นส่วนที่เสียหาย';
                break;
            case 'troubleshooting':
                description = 'วิดีโอนี้แสดงการวินิจฉัยและแก้ไขปัญหาที่พบบ่อยในระบบ Hot Runner เช่น การอุดตัน การรั่วไหล และปัญหาด้านคุณภาพชิ้นงาน';
                break;
        }
        
        const descriptionElement = document.getElementById('video-category-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = `<p>${description}</p>`;
        }
    }
    
    /**
     * อัปเดตคำอธิบายวิดีโอเฉพาะ
     * @param {string} description - คำอธิบายวิดีโอ
     */
    function updateVideoDescription(description) {
        const descriptionElement = document.getElementById('video-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = `<p>${description}</p>`;
        }
    }
    
    /**
     * เพิ่มวิดีโอใหม่ไปยังฐานข้อมูล
     * @param {string} category - ประเภทของวิดีโอ
     * @param {Object} videoData - ข้อมูลวิดีโอที่จะเพิ่ม
     */
    function addVideo(category, videoData) {
        if (!videoDatabase[category]) {
            videoDatabase[category] = [];
        }
        
        videoDatabase[category].push(videoData);
        
        // ถ้าประเภทวิดีโอปัจจุบันตรงกับประเภทที่เพิ่มเข้าไป ให้แสดงรายการวิดีโอใหม่
        if (currentVideoCategory === category) {
            displayVideoList(category);
        }
    }
    
    // เปิดเผย API สำหรับการเพิ่มวิดีโอจากภายนอก
    window.HotRunnerVideos = {
        addVideo: addVideo
    };
});