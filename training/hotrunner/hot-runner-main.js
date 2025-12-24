/**
 * hot-runner-main.js
 * ไฟล์นี้ใช้สำหรับการจัดการฟังก์ชันหลักของสื่อการสอน Hot Runner Mold System
 */

// เมื่อโหลด DOM เสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', function() {
    // ตัวแปรสำหรับเก็บสถานะโมเดล 3D
    window.modelInitialized = false;
    window.originalPositionsSaved = false;
    
    // =============== การจัดการเมนูและการนำทาง ===============
    // จัดการการคลิกเมนู
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            
            // ยกเลิกการเลือกทั้งหมด
            menuItems.forEach(i => i.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            
            // เลือกรายการที่คลิกและหน้าที่เกี่ยวข้อง
            this.classList.add('active');
            document.getElementById(pageId).classList.add('active');
            
            // ปิดเมนูบนมือถือ
            document.body.classList.remove('menu-open');
            
            // เริ่มต้น Three.js ถ้าอยู่ที่หน้าโมเดล 3D
            if (pageId === '3d-model' && window.HotRunnerModels && !window.modelInitialized) {
                window.HotRunnerModels.initThreeJS('three-js-container');
                window.modelInitialized = true;
                setupModelControls();
            }
        });
    });
    
    // ปุ่มเปิด/ปิดเมนูสำหรับอุปกรณ์มือถือ
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.body.classList.toggle('menu-open');
        });
    }
    
    // =============== การจัดการโมเดล 3D ===============
    // ตัวเลือกโมเดล
    const modelSelectors = document.querySelectorAll('.model-selector');
    modelSelectors.forEach(selector => {
        selector.addEventListener('click', function() {
            const modelType = this.getAttribute('data-model');
            
            // ยกเลิกการเลือกทั้งหมด
            modelSelectors.forEach(s => s.classList.remove('active'));
            
            // เลือกรายการที่คลิก
            this.classList.add('active');
            
            // แสดงโมเดล 3D
            if (window.HotRunnerModels && window.modelInitialized) {
                window.HotRunnerModels.showModel(modelType);
            }
            
            // อัปเดตคำอธิบายตามโมเดลที่เลือก
            updateModelDescription(modelType);
        });
    });
    
    // อัปเดตคำอธิบายโมเดล
    function updateModelDescription(modelType) {
        let description = '';
        switch(modelType) {
            case 'valve-gate':
                description = 'Valve Gate System ใช้เข็มควบคุมการไหลของพลาสติก ให้คุณภาพชิ้นงานดีที่สุด แต่มีราคาสูงและซับซ้อนในการบำรุงรักษา';
                break;
            case 'thermal-gate':
                description = 'Thermal Gate System ควบคุมการไหลด้วยอุณหภูมิ ราคาถูกกว่าแบบ Valve Gate แต่อาจมีปัญหาเรื่องรอยตำหนิบนชิ้นงาน';
                break;
            case 'open-tip':
                description = 'Open Tip System เป็นระบบที่พลาสติกไหลผ่านโดยตรง เหมาะกับพลาสติกที่มีความหนืดต่ำ มีโครงสร้างไม่ซับซ้อน';
                break;
        }
        
        const descriptionElement = document.querySelector('.model-description p');
        if (descriptionElement) {
            descriptionElement.textContent = description;
        }
    }
    
    // ตั้งค่าปุ่มควบคุมโมเดล 3D
    function setupModelControls() {
        if (!window.HotRunnerModels) return;
        
        // ปุ่มแสดง/ซ่อนป้ายชื่อ
        const toggleLabelsButton = document.getElementById('toggle-labels');
        let labelsVisible = false;
        
        if (toggleLabelsButton) {
            toggleLabelsButton.addEventListener('click', function() {
                labelsVisible = !labelsVisible;
                window.HotRunnerModels.toggleLabels(labelsVisible);
                this.innerHTML = labelsVisible ? 
                    '<i class="fas fa-tags"></i> ซ่อนป้ายชื่อ' : 
                    '<i class="fas fa-tags"></i> แสดงป้ายชื่อ';
            });
        }
        
        // ปุ่มแสดงการทำงาน
        const toggleAnimationButton = document.getElementById('toggle-animation');
        let animationActive = false;
        let animationParticle = null;
        
        if (toggleAnimationButton) {
            toggleAnimationButton.addEventListener('click', function() {
                animationActive = !animationActive;
                
                if (animationActive) {
                    // เริ่มแอนิเมชัน
                    const modelSelectors = document.querySelectorAll('.model-selector');
                    let activeModelType = 'valve-gate'; // ค่าเริ่มต้น
                    
                    // หาชนิดของโมเดลที่กำลังแสดงอยู่
                    modelSelectors.forEach(selector => {
                        if (selector.classList.contains('active')) {
                            activeModelType = selector.getAttribute('data-model');
                        }
                    });
                    
                    if (activeModelType === 'valve-gate') {
                        window.HotRunnerModels.animateValveGate();
                    }
                    
                    // แสดงการไหลของพลาสติก
                    animationParticle = window.HotRunnerModels.animatePlasticFlow(activeModelType);
                    
                    this.innerHTML = '<i class="fas fa-stop"></i> หยุดการทำงาน';
                } else {
                    // หยุดแอนิเมชัน
                    if (animationParticle) {
                        // ลบอนุภาค
                        animationParticle.parent.remove(animationParticle);
                        animationParticle = null;
                    }
                    
                    this.innerHTML = '<i class="fas fa-play"></i> แสดงการทำงาน';
                }
            });
        }
        
        // ปุ่มแยกชิ้นส่วน
        const toggleExplodeButton = document.getElementById('toggle-explode');
        let exploded = false;
        
        if (toggleExplodeButton) {
            toggleExplodeButton.addEventListener('click', function() {
                exploded = !exploded;
                
                // บันทึกตำแหน่งเดิมก่อนแยกชิ้นส่วนครั้งแรก
                if (!window.originalPositionsSaved) {
                    window.HotRunnerModels.saveOriginalPositions(window.currentModel);
                    window.originalPositionsSaved = true;
                }
                
                window.HotRunnerModels.createExplodedView(window.currentModel, exploded);
                
                this.innerHTML = exploded ? 
                    '<i class="fas fa-compress-arrows-alt"></i> รวมชิ้นส่วน' : 
                    '<i class="fas fa-expand-arrows-alt"></i> แยกชิ้นส่วน';
            });
        }
        
        // ปุ่มรีเซ็ตมุมมอง
        const resetViewButton = document.getElementById('reset-view');
        
        if (resetViewButton) {
            resetViewButton.addEventListener('click', function() {
                // รีเซ็ตมุมมองกล้อง
                if (window.controls) {
                    window.controls.reset();
                }
                
                // รีเซ็ตการหมุนของโมเดล
                if (window.currentModel) {
                    window.currentModel.rotation.set(0, 0, 0);
                }
            });
        }
    }
    
    // =============== การจัดการวิดีโอ ===============
    // ตัวเลือกวิดีโอ
    const videoButtons = document.querySelectorAll('.video-button');
    videoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const videoType = this.getAttribute('data-video');
            
            // ยกเลิกการเลือกทั้งหมด
            videoButtons.forEach(b => b.classList.remove('active'));
            
            // เลือกรายการที่คลิก
            this.classList.add('active');
            
            // โหลดวิดีโอตามประเภท (ในอนาคตจะเป็นการโหลดวิดีโอจริง)
            console.log(`กำลังโหลดวิดีโอ: ${videoType}`);
            
            // อัปเดตคำอธิบายตามวิดีโอที่เลือก
            updateVideoDescription(videoType);
        });
    });
    
    // อัปเดตคำอธิบายวิดีโอ
    function updateVideoDescription(videoType) {
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
        
        const descriptionElement = document.getElementById('video-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = `<p>${description}</p>`;
        }
    }
    
    // =============== การจัดการแบบทดสอบ ===============
    // ตัวจัดการแบบทดสอบ
    const submitQuizButton = document.getElementById('submit-quiz');
    if (submitQuizButton) {
        submitQuizButton.addEventListener('click', function() {
            // เฉลยคำตอบ
            const answers = {
                q1: 'a', // ไม่มีการสูญเสียพลาสติกในส่วนของ Runner
                q2: 'b', // Manifold
                q3: 'b', // Valve Gate
                q4: 'c', // ตรวจสอบและเปลี่ยนซีลที่เสื่อมสภาพ
                q5: 'c'  // ราคาแม่พิมพ์ถูกกว่า (ไม่ใช่จริง เพราะ Hot Runner มีราคาแพงกว่า)
            };
            
            // ตรวจคำตอบ
            let score = 0;
            let feedback = '';
            
            for (let question in answers) {
                const selectedOption = document.querySelector(`input[name="${question}"]:checked`);
                if (selectedOption) {
                    if (selectedOption.value === answers[question]) {
                        score++;
                        feedback += `<p>ข้อ ${question.substring(1)}: ถูกต้อง ✓</p>`;
                    } else {
                        feedback += `<p>ข้อ ${question.substring(1)}: ไม่ถูกต้อง ✗</p>`;
                    }
                } else {
                    feedback += `<p>ข้อ ${question.substring(1)}: ไม่ได้ตอบ</p>`;
                }
            }
            
            // แสดงผลคะแนน
            const scoreElement = document.getElementById('score');
            const feedbackElement = document.getElementById('feedback');
            const resultElement = document.getElementById('quiz-result');
            
            if (scoreElement && feedbackElement && resultElement) {
                scoreElement.textContent = score;
                feedbackElement.innerHTML = feedback;
                resultElement.style.display = 'block';
                
                // เลื่อนไปที่ผลลัพธ์
                resultElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // =============== การทำให้โค้ดเริ่มทำงาน ===============
    // แสดงหน้าแรกเป็นค่าเริ่มต้น (ถ้าไม่มีแฮชในURL)
    if (!window.location.hash) {
        const homeMenuItem = document.querySelector('.menu-item[data-page="home"]');
        if (homeMenuItem) {
            homeMenuItem.classList.add('active');
        }
        
        const homePage = document.getElementById('home');
        if (homePage) {
            homePage.classList.add('active');
        }
    }
    
    // แสดงว่าโหลดเสร็จแล้ว
    console.log('สื่อการสอน Hot Runner Mold System พร้อมใช้งานแล้ว');
});