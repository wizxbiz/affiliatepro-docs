const fs = require('fs');
const path = require('path');

class ProjectAnalyzer {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.requiredFiles = [
            'index.html',
            'manifest.json', 
            'sw.js',
            'icons/icon-192x192.png',
            'icons/icon-512x512.png'
        ];
    }

    scanProject() {
        console.log('🔍 กำลังสแกนโครงสร้างไฟล์...\n');
        this.scanDirectory(this.rootPath, 0);
        this.checkRequirements();
    }

    scanDirectory(dirPath, level) {
        try {
            const items = fs.readdirSync(dirPath);
            const indent = '  '.repeat(level);
            
            items.forEach(item => {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    console.log(`${indent}📁 ${item}/`);
                    this.scanDirectory(fullPath, level + 1);
                } else {
                    console.log(`${indent}📄 ${item}`);
                }
            });
        } catch (error) {
            console.log(`${ind}❌ ไม่สามารถอ่านโฟลเดอร์: ${dirPath}`);
        }
    }

    checkRequirements() {
        console.log('\n✅ ตรวจสอบไฟล์จำเป็น:');
        console.log('=' .repeat(40));
        
        this.requiredFiles.forEach(file => {
            const fullPath = path.join(this.rootPath, file);
            const exists = fs.existsSync(fullPath);
            const status = exists ? '✅ พบ' : '❌ ไม่พบ';
            console.log(`${status} ${file}`);
        });
    }

    generateReport() {
        console.log('\n📊 รายงานโครงสร้างโปรเจคต์:');
        console.log('=' .repeat(40));
        
        const stats = {
            totalFiles: 0,
            totalFolders: 0,
            htmlFiles: 0,
            cssFiles: 0,
            jsFiles: 0,
            imageFiles: 0,
            missingFiles: []
        };

        this.countFiles(this.rootPath, stats);
        
        console.log(`📄 ไฟล์ทั้งหมด: ${stats.totalFiles} ไฟล์`);
        console.log(`📁 โฟลเดอร์ทั้งหมด: ${stats.totalFolders} โฟลเดอร์`);
        console.log(`🌐 HTML Files: ${stats.htmlFiles}`);
        console.log(`🎨 CSS Files: ${stats.cssFiles}`); 
        console.log(`⚡ JavaScript Files: ${stats.jsFiles}`);
        console.log(`🖼️ Image Files: ${stats.imageFiles}`);
        
        if (stats.missingFiles.length > 0) {
            console.log('\n⚠️  ไฟล์ที่ขาดหาย:');
            stats.missingFiles.forEach(file => {
                console.log(`   ❌ ${file}`);
            });
        }
    }

    countFiles(dirPath, stats) {
        try {
            const items = fs.readdirSync(dirPath);
            
            items.forEach(item => {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    stats.totalFolders++;
                    this.countFiles(fullPath, stats);
                } else {
                    stats.totalFiles++;
                    
                    // จัดประเภทไฟล์
                    if (item.endsWith('.html')) stats.htmlFiles++;
                    else if (item.endsWith('.css')) stats.cssFiles++;
                    else if (item.endsWith('.js')) stats.jsFiles++;
                    else if (item.match(/\.(png|jpg|jpeg|gif|svg)$/)) stats.imageFiles++;
                }
            });
        } catch (error) {
            console.log(`❌ ไม่สามารถอ่าน: ${dirPath}`);
        }
    }
}

// ใช้งาน
const analyzer = new ProjectAnalyzer('.'); // ใช้ . สำหรับโฟลเดอร์ปัจจุบัน
analyzer.scanProject();
analyzer.generateReport();