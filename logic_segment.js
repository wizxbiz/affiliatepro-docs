<!-- ========================================
         COMMUNITY PRODUCT DETAIL MODAL
         ======================================== -->
    <div class="comm-modal-overlay" id="commProductModal" onclick="closeCommProductModal(event)">
        <div class="comm-modal-container" onclick="event.stopPropagation()">
            <button class="comm-modal-close" onclick="closeCommProductModal()">
                <i class="fas fa-times"></i>
            </button>

            <!-- Main Content -->
            <div class="comm-modal-content">
                <!-- Left: Image Gallery -->
                <div class="comm-modal-gallery">
                    <div class="comm-main-image">
                        <img id="commModalMainImage" src="" alt="Product Image">
                        <span class="comm-badge-otop" id="commModalBadge" style="display:none;">OTOP</span>
                    </div>
                    <div class="comm-thumbnail-row" id="commModalThumbnails">
                        <!-- Thumbnails will be added dynamically -->
                    </div>
                </div>

                <!-- Right: Product Info -->
                <div class="comm-modal-info">
                    <!-- Seller Info -->
                    <div class="comm-seller-card">
                        <div class="comm-seller-avatar" id="commModalSellerAvatar">👨‍🌾</div>
                        <div class="comm-seller-details">
                            <span class="comm-seller-name" id="commModalSellerName">ชื่อฟาร์ม/ผู้ขาย</span>
                            <span class="comm-seller-location"><i class="fas fa-map-marker-alt"></i> <span
                                    id="commModalLocation">จังหวัด</span></span>
                        </div>
                        <button class="comm-follow-btn" onclick="followSeller()">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>

                    <!-- Product Title & Price -->
                    <h2 class="comm-product-title" id="commModalTitle">ชื่อสินค้า</h2>

                    <div class="comm-price-section">
                        <span class="comm-price" id="commModalPrice">฿0</span>
                        <span class="comm-unit" id="commModalUnit">/กิโลกรัม</span>
                        <span class="comm-stock" id="commModalStock"><i class="fas fa-box"></i> มีสินค้า</span>
                    </div>

                    <!-- Rating -->
                    <div class="comm-rating-row">
                        <div class="comm-stars" id="commModalStars">★★★★★</div>
                        <span class="comm-rating-text" id="commModalRatingText">5.0 (0 รีวิว)</span>
                        <span class="comm-sold" id="commModalSold">ขายแล้ว 0 ชิ้น</span>
                    </div>

                    <!-- Tags -->
                    <div class="comm-tags" id="commModalTags">
                        <!-- Tags dynamically added -->
                    </div>

                    <!-- Description -->
                    <div class="comm-description">
                        <h4><i class="fas fa-info-circle"></i> รายละเอียดสินค้า</h4>
                        <p id="commModalDesc">รายละเอียดสินค้า...</p>
                    </div>

                    <!-- Quantity Selector -->
                    <div class="comm-quantity-section">
                        <label>จำนวน:</label>
                        <div class="comm-quantity-control">
                            <button onclick="adjustCommQty(-1)"><i class="fas fa-minus"></i></button>
                            <input type="number" id="commQtyInput" value="1" min="1" max="99">
                            <button onclick="adjustCommQty(1)"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="comm-action-buttons">
                        <button class="comm-btn-buy" onclick="requestToBuy(true)">
                            <i class="fas fa-shopping-cart"></i> ขอซื้อสินค้า
                        </button>
                        <div class="comm-contact-grid">
                            <button class="comm-btn-messenger" onclick="contactCommMessenger()">
                                <i class="fab fa-facebook-messenger"></i> Messenger
                            </button>
                            <button class="comm-btn-contact" onclick="contactCommSeller()">
                                <i class="fab fa-line"></i> LINE
                            </button>
                        </div>
                    </div>

                    <!-- Share Buttons -->
                    <div class="comm-share-row">
                        <span>แชร์/บันทึก:</span>
                        <button onclick="shareCommProduct('line')"><i class="fab fa-line"></i></button>
                        <button onclick="shareCommProduct('facebook')"><i class="fab fa-facebook-f"></i></button>
                        <button onclick="shareCommProduct('copy')"><i class="fas fa-link"></i></button>
                        <button id="saveModalCommProduct" onclick="toggleSaveModalItem()" style="margin-left: 10px;">
                            <i class="far fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Related Products -->
            <div class="comm-related-section">
                <h4><i class="fas fa-leaf"></i> สินค้าที่คล้ายกัน</h4>
                <div class="comm-related-grid" id="commRelatedProducts">
                    <!-- Related products loaded dynamically -->
                </div>
            </div>
        </div>
    </div>

    <style>
        /* Community Product Modal Styles */
        .comm-modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: 9999;
            overflow-y: auto;
            padding: 20px;
            animation: fadeIn 0.3s;
        }

        .comm-modal-overlay.show {
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }

        .comm-modal-container {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 24px;
            width: 100%;
            max-width: 1000px;
            margin: 40px auto;
            position: relative;
            overflow: hidden;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }

            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .comm-modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            z-index: 10;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s;
        }

        .comm-modal-close:hover {
            background: #ff4757;
            transform: rotate(90deg);
        }

        .comm-modal-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            padding: 30px;
        }

        @media (max-width: 768px) {
            .comm-modal-content {
                grid-template-columns: 1fr;
            }
        }

        /* Gallery */
        .comm-modal-gallery {
            position: relative;
        }

        .comm-main-image {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 16px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05);
            position: relative;
        }

        .comm-main-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .comm-badge-otop {
            position: absolute;
            top: 15px;
            left: 15px;
            background: linear-gradient(135deg, #FF6B35, #F7C441);
            color: #1a1a2e;
            font-weight: 700;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
        }

        .comm-thumbnail-row {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            overflow-x: auto;
            padding-bottom: 5px;
        }

        .comm-thumbnail-row img {
            width: 60px;
            height: 60px;
            border-radius: 10px;
            object-fit: cover;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.3s;
        }

        .comm-thumbnail-row img.active,
        .comm-thumbnail-row img:hover {
            border-color: #a78bfa;
        }

        /* Product Info */
        .comm-modal-info {
            color: white;
        }

        .comm-seller-card {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255, 255, 255, 0.08);
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .comm-seller-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4ade80, #22c55e);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .comm-seller-details {
            flex: 1;
        }

        .comm-seller-name {
            font-weight: 600;
            display: block;
        }

        .comm-seller-location {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
        }

        .comm-follow-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #f87171;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }

        .comm-follow-btn:hover {
            background: #f87171;
            color: white;
        }

        .comm-product-title {
            font-size: 1.6rem;
            font-weight: 700;
            margin-bottom: 10px;
            line-height: 1.3;
        }

        .comm-price-section {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .comm-price {
            font-size: 2rem;
            font-weight: 700;
            color: #4ade80;
        }

        .comm-unit {
            color: rgba(255, 255, 255, 0.6);
            font-size: 1rem;
        }

        .comm-stock {
            background: rgba(74, 222, 128, 0.2);
            color: #4ade80;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-left: auto;
        }

        .comm-rating-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .comm-stars {
            color: #F7C441;
            font-size: 1.1rem;
        }

        .comm-rating-text {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }

        .comm-sold {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.85rem;
        }

        /* Guide Modal Styles */
        .guide-modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10001;
            padding: 20px;
            backdrop-filter: blur(10px);
            justify-content: center;
            align-items: center;
        }

        .guide-modal-overlay.show {
            display: flex;
        }

        .guide-modal-container {
            background: #1e293b;
            width: 100%;
            max-width: 800px;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }

        .guide-header {
            padding: 24px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .guide-header h3 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
        }

        .guide-tabs {
            display: flex;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .guide-tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 600;
            border-bottom: 3px solid transparent;
        }

        .guide-tab.active {
            color: #60a5fa;
            border-bottom-color: #60a5fa;
            background: rgba(59, 130, 246, 0.1);
        }

        .guide-body {
            padding: 30px;
            overflow-y: auto;
            color: rgba(255, 255, 255, 0.8);
        }

        .guide-section {
            display: none;
        }

        .guide-section.active {
            display: block;
        }

        .guide-step {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
            align-items: flex-start;
        }

        .step-num {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            flex-shrink: 0;
            border: 2px solid #60a5fa;
        }

        .step-content h4 {
            color: white;
            margin-bottom: 5px;
            font-weight: 600;
        }

        .faq-item {
            margin-bottom: 20px;
            background: rgba(255, 255, 255, 0.05);
            padding: 15px 20px;
            border-radius: 12px;
            border-left: 4px solid #8b5cf6;
        }

        .faq-q {
            color: #c084fc;
            font-weight: 700;
            margin-bottom: 5px;
            display: block;
        }

        .faq-a {
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
        }

        .guide-close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
        }

        .comm-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
        }

        .comm-tag {
            background: rgba(255, 255, 255, 0.08);
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.8);
        }

        .comm-tag.organic {
            background: rgba(74, 222, 128, 0.2);
            color: #4ade80;
        }

        .comm-tag.otop {
            background: rgba(247, 196, 65, 0.2);
            color: #F7C441;
        }

        .comm-description {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .comm-description h4 {
            font-size: 0.95rem;
            margin-bottom: 8px;
            color: rgba(255, 255, 255, 0.8);
        }

        .comm-description p {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
            white-space: pre-line;
        }

        .comm-quantity-section {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }

        .comm-quantity-control {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 10px;
        }

        .comm-quantity-control button {
            width: 40px;
            height: 40px;
            border: none;
            background: transparent;
            color: white;
            cursor: pointer;
            font-size: 1rem;
        }

        .comm-quantity-control button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .comm-quantity-control input {
            width: 50px;
            text-align: center;
            border: none;
            background: transparent;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .comm-action-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        }

        .comm-contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .comm-btn-buy {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #FF6B35, #FF4757);
            color: white;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
        }

        .comm-btn-buy:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 107, 53, 0.5);
            background: linear-gradient(135deg, #FF7B45, #FF5767);
        }

        .comm-btn-messenger,
        .comm-btn-contact {
            padding: 14px 20px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s;
        }

        .comm-btn-messenger {
            background: linear-gradient(135deg, #0084FF, #00C6FF);
            color: white;
        }

        .comm-btn-messenger:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 132, 255, 0.4);
        }

        .comm-btn-cart:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .comm-btn-contact {
            background: linear-gradient(135deg, #00B900, #06C755);
            color: white;
        }

        .comm-btn-contact:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 185, 0, 0.4);
        }

        .comm-share-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .comm-share-row span {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
        }

        .comm-share-row button {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
        }

        .comm-share-row button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }

        /* Related Products */
        .comm-related-section {
            padding: 20px 30px 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .comm-related-section h4 {
            color: white;
            margin-bottom: 15px;
        }

        .comm-related-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }

        @media (max-width: 768px) {
            .comm-related-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        .comm-related-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s;
        }

        .comm-related-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.1);
        }

        .comm-related-card img {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
        }

        .comm-related-card .info {
            padding: 10px;
        }

        .comm-related-card .name {
            font-size: 0.85rem;
            color: white;
            font-weight: 500;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .comm-related-card .price {
            color: #4ade80;
            font-weight: 700;
            font-size: 0.95rem;
            margin-top: 5px;
        }
    </style>

    <!-- AI Generator Button (Disabled for now) -->


    <!-- Quick View Modal -->
    <div class="quick-view-modal" id="quickViewModal" onclick="closeQuickView(event)">
        <div class="quick-view-content" onclick="event.stopPropagation()">
            <div class="quick-view-image">
                <button class="quick-view-close" onclick="closeQuickView()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="quick-view-main-image" onclick="openImageZoom()">
                    <img id="quickViewImage" src="" alt="Product">
                </div>
                <div class="quick-view-gallery" id="quickViewGallery">
                    <!-- Thumbnails will be added here dynamically -->
                </div>
            </div>
            <div class="quick-view-details">
                <h2 id="quickViewName">ชื่อสินค้า</h2>
                <div class="price" id="quickViewPrice">฿0</div>
                <div class="description" id="quickViewDesc">รายละเอียดสินค้า...</div>
                <div class="quick-view-seller">
                    <div class="quick-view-seller-avatar" id="quickViewSellerAvatar">A</div>
                    <div>
                        <strong id="quickViewSellerName">ผู้ขาย</strong>
                        <small class="d-block text-muted" id="quickViewDate">ลงขายเมื่อ...</small>
                        <button class="btn btn-sm btn-outline-primary mt-1" onclick="viewSellerFromModal()"
                            style="font-size: 0.7rem; padding: 2px 8px; border-radius: 20px;">
                            <i class="fas fa-store"></i> เข้าชมร้านนี้
                        </button>
                    </div>
                </div>
                <!-- Contact Info Section - Enhanced -->
                <div class="quick-view-contact-section" id="quickViewContact">
                    <div class="contact-section-title">
                        <i class="fas fa-address-card"></i> ข้อมูลการติดต่อ
                    </div>
                    <div class="contact-item" id="quickViewLineIdContainer">
                        <div class="contact-icon email" style="background: #06C755;">
                            <i class="fab fa-line"></i>
                        </div>
                        <span class="contact-text" id="quickViewLineId">-</span>
                    </div>
                    <div class="contact-item" id="quickViewMessengerContainer">
                        <div class="contact-icon messenger" style="background: #0084FF;">
                            <i class="fab fa-facebook-messenger"></i>
                        </div>
                        <span class="contact-text" id="quickViewMessenger">-</span>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon location">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <span class="contact-text" id="quickViewLocation">-</span>
                    </div>
                </div>
                <div class="quick-view-actions" style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="quick-view-btn primary buy-btn" onclick="requestToBuy(false)"
                        style="background: linear-gradient(135deg, #FF6B35, #FF4757); width: 100%;">
                        <i class="fas fa-shopping-cart"></i> ขอซื้อสินค้า
                    </button>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; width: 100%;">
                        <button class="quick-view-btn primary" onclick="contactSeller()" style="width: 100%;">
                            <i class="fab fa-line"></i> ติดต่อ
                        </button>
                        <button class="quick-view-btn secondary" onclick="shareProduct()" style="width: 100%;">
                            <i class="fas fa-share-alt"></i> แชร์
                        </button>
                        <button class="quick-view-btn secondary" id="saveModalProductBtn"
                            onclick="toggleSaveModalItem()" style="width: 100%;">
                            <i class="far fa-bookmark"></i> บันทึก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Image Zoom Modal -->
    <div class="image-zoom-modal" id="imageZoomModal" onclick="closeImageZoom()">
        <img id="zoomImage" src="" alt="Zoomed Image">
    </div>

    <!-- Share Menu -->
    <div class="share-menu" id="shareMenu">
        <div class="share-menu-header">
            <h4>แชร์สินค้า</h4>
            <button onclick="closeShareMenu()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="share-options">
            <button class="share-option line" onclick="shareToLineApp()">
                <i class="fab fa-line"></i>
                <span>LINE</span>
            </button>
            <button class="share-option facebook" onclick="shareToFacebook()">
                <i class="fab fa-facebook-f"></i>
                <span>Facebook</span>
            </button>
            <button class="share-option twitter" onclick="shareToTwitter()">
                <i class="fab fa-twitter"></i>
                <span>Twitter</span>
            </button>
            <button class="share-option copy" onclick="copyProductLink()">
                <i class="fas fa-link"></i>
                <span>คัดลอกลิงก์</span>
            </button>
        </div>
    </div>
    <!-- Enhanced Seller Dashboard Modal -->
    <div class="seller-dashboard-modal" id="sellerDashboardModal" onclick="closeSellerDashboard(event)">
        <div class="seller-dashboard-content" onclick="event.stopPropagation()">
            <div class="seller-dashboard-header">
                <button class="seller-close-btn" onclick="closeSellerDashboard()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="seller-header-content">
                    <div class="seller-avatar-large" id="sellerAvatarLarge">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="seller-info-main">
                        <h2 id="sellerShopName">ชื่อร้านค้าของคุณ</h2>
                        <p id="sellerShopId"><i class="fab fa-line"></i> LINE ID: -</p>
                        <div class="seller-badge-row">
                            <span class="seller-verified-badge"><i class="fas fa-check-circle"></i>
                                ยืนยันตัวตนแล้ว</span>
                            <span class="seller-member-since" id="sellerMemberSince">สมาชิกตั้งแต่ -</span>
                        </div>
                    </div>
                    <button class="seller-share-btn" onclick="shareMyShop()" title="แชร์ร้านของฉัน">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="seller-quick-actions">
                <a href="post-product.html" class="sq-action-btn primary">
                    <i class="fas fa-plus-circle"></i>
                    <span>ลงขายใหม่</span>
                </a>
                <button class="sq-action-btn" onclick="openShopSettings()">
                    <i class="fas fa-cog"></i>
                    <span>ตั้งค่าร้าน</span>
                </button>
                <button class="sq-action-btn" onclick="viewShopAnalytics()">
                    <i class="fas fa-chart-line"></i>
                    <span>วิเคราะห์</span>
                </button>
                <button class="sq-action-btn" onclick="openPromotions()">
                    <i class="fas fa-bullhorn"></i>
                    <span>โปรโมท</span>
                </button>
            </div>

            <!-- Dashboard Stats -->
            <div class="seller-stats-grid">
                <div class="seller-stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="stat-info">
                        <span class="seller-stat-value" id="statTotalProducts">0</span>
                        <span class="seller-stat-label">สินค้าทั้งหมด</span>
                    </div>
                </div>
                <div class="seller-stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4ade80, #22c55e);">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <span class="seller-stat-value" id="statActiveProducts" style="color: #4ade80;">0</span>
                        <span class="seller-stat-label">กำลังขาย</span>
                    </div>
                </div>
                <div class="seller-stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #fb923c, #f97316);">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="stat-info">
                        <span class="seller-stat-value" id="statSoldProducts" style="color: #fb923c;">0</span>
                        <span class="seller-stat-label">ขายแล้ว</span>
                    </div>
                </div>
                <div class="seller-stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #60a5fa, #3b82f6);">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="stat-info">
                        <span class="seller-stat-value" id="statTotalViews" style="color: #60a5fa;">0</span>
                        <span class="seller-stat-label">ยอดดูทั้งหมด</span>
                    </div>
                </div>
            </div>

            <!-- Notifications / Alerts -->
            <div class="seller-alerts" id="sellerAlerts">
                <!-- Alerts loaded dynamically -->
            </div>

            <!-- Search & Actions Bar -->
            <div class="seller-search-bar">
                <div class="seller-search-input-wrapper">
                    <i class="fas fa-search"></i>
                    <input type="text" class="seller-search-input" id="sellerSearchInput"
                        placeholder="ค้นหาสินค้าในร้านของคุณ..." oninput="filterSellerProducts()">
                </div>
                <select class="seller-sort-select" id="sellerSortSelect" onchange="sortSellerProducts()">
                    <option value="newest">ล่าสุด</option>
                    <option value="oldest">เก่าสุด</option>
                    <option value="price-high">ราคาสูง-ต่ำ</option>
                    <option value="price-low">ราคาต่ำ-สูง</option>
                    <option value="views">ยอดดูสูงสุด</option>
                </select>
            </div>

            <!-- Tabs Navigation -->
            <div class="seller-tabs">
                <button class="seller-tab active" onclick="showSellerTab('active')">
                    <i class="fas fa-tag"></i> กำลังขาย (<span id="countActive">0</span>)
                </button>
                <button class="seller-tab" onclick="showSellerTab('sold')">
                    <i class="fas fa-check"></i> ขายแล้ว (<span id="countSold">0</span>)
                </button>
                <button class="seller-tab" onclick="showSellerTab('draft')">
                    <i class="fas fa-file-alt"></i> แบบร่าง (<span id="countDraft">0</span>)
                </button>
            </div>

            <!-- Products Grid Container -->
            <div class="seller-products-grid" id="sellerProductsGrid">
                <!-- Products will be loaded here -->
            </div>

            <!-- Bottom Actions -->
            <div class="seller-bottom-actions">
                <a href="post-product.html" class="btn-post-main">
                    <i class="fas fa-plus"></i> ลงขายสินค้าใหม่
                </a>
                <button class="btn-help" onclick="openSellerHelp()">
                    <i class="fas fa-question-circle"></i> ช่วยเหลือ
                </button>
            </div>
        </div>
    </div>

    <!-- Shop Settings Modal -->
    <div class="shop-settings-modal" id="shopSettingsModal" onclick="closeShopSettings(event)">
        <div class="shop-settings-content" onclick="event.stopPropagation()">
            <div class="shop-settings-header">
                <h3><i class="fas fa-cog"></i> ตั้งค่าร้านของฉัน</h3>
                <button class="close-btn" onclick="closeShopSettings()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="shop-settings-body">
                <div class="setting-group">
                    <label><i class="fas fa-store"></i> ชื่อร้านค้า</label>
                    <input type="text" id="settingShopName" placeholder="กรอกชื่อร้านค้าของคุณ" maxlength="50">
                    <small>ชื่อที่แสดงให้ลูกค้าเห็น</small>
                </div>
                <div class="setting-group">
                    <label><i class="fab fa-line"></i> LINE ID</label>
                    <input type="text" id="settingLineId" placeholder="@yourlineid" maxlength="30">
                    <small>ลูกค้าจะใช้ติดต่อคุณ</small>
                </div>
                <div class="setting-group">
                    <label><i class="fas fa-phone"></i> เบอร์โทรศัพท์</label>
                    <input type="tel" id="settingPhone" placeholder="0812345678" maxlength="10">
                    <small>ไม่บังคับ</small>
                </div>
                <div class="setting-group">
                    <label><i class="fas fa-map-marker-alt"></i> ที่อยู่/จังหวัด</label>
                    <input type="text" id="settingLocation" placeholder="กรุงเทพฯ" maxlength="100">
                    <small>แสดงพื้นที่ให้บริการ</small>
                </div>
                <div class="setting-group">
                    <label><i class="fas fa-info-circle"></i> คำอธิบายร้าน</label>
                    <textarea id="settingDescription" placeholder="บอกเล่าเกี่ยวกับร้านของคุณ..." rows="3"
                        maxlength="200"></textarea>
                </div>
            </div>
            <div class="shop-settings-footer">
                <button class="btn-cancel" onclick="closeShopSettings()">ยกเลิก</button>
                <button class="btn-save" onclick="saveShopSettings()">
                    <i class="fas fa-save"></i> บันทึก
                </button>
            </div>
        </div>
    </div>

    <style>
        /* Shop Settings Modal */
        .shop-settings-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .shop-settings-modal.show {
            display: flex;
        }

        .shop-settings-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 20px;
            width: 100%;
            max-width: 500px;
            overflow: hidden;
            animation: slideUp 0.3s ease;
        }

        .shop-settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }

        .shop-settings-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }

        .shop-settings-header .close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            font-size: 1rem;
        }

        .shop-settings-header .close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .shop-settings-body {
            padding: 25px;
            max-height: 400px;
            overflow-y: auto;
        }

        .setting-group {
            margin-bottom: 20px;
        }

        .setting-group label {
            display: block;
            color: white;
            font-weight: 500;
            margin-bottom: 8px;
            font-size: 0.95rem;
        }

        .setting-group label i {
            margin-right: 8px;
            color: #667eea;
        }

        .setting-group input,
        .setting-group textarea {
            width: 100%;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: white;
            font-size: 1rem;
            transition: all 0.3s;
        }

        .setting-group input:focus,
        .setting-group textarea:focus {
            outline: none;
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.15);
        }

        .setting-group input::placeholder,
        .setting-group textarea::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .setting-group small {
            display: block;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.8rem;
            margin-top: 5px;
        }

        .setting-group textarea {
            resize: vertical;
            min-height: 80px;
        }

        .shop-settings-footer {
            display: flex;
            gap: 10px;
            padding: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .shop-settings-footer button {
            flex: 1;
            padding: 12px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-cancel {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
        }

        .btn-cancel:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .btn-save {
            background: linear-gradient(135deg, #00B900, #06C755);
            border: none;
            color: white;
        }

        .btn-save:hover {
            box-shadow: 0 5px 20px rgba(0, 185, 0, 0.4);
            transform: translateY(-2px);
        }
    </style>

    <style>
        /* Enhanced Seller Dashboard Styles */
        .seller-dashboard-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: 9999;
            justify-content: center;
            align-items: flex-start;
            overflow-y: auto;
            padding: 20px;
        }

        .seller-dashboard-modal.show,
        .seller-dashboard-modal[style*="flex"] {
            display: flex;
        }

        .seller-dashboard-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 20px;
            width: 100%;
            max-width: 800px;
            margin: 20px auto;
            overflow: hidden;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from {
                transform: translateY(30px);
                opacity: 0;
            }

            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .seller-dashboard-header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            padding: 25px;
            position: relative;
        }

        .seller-close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
        }

        .seller-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .seller-header-content {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .seller-avatar-large {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: white;
        }

        .seller-info-main {
            flex: 1;
            color: white;
        }

        .seller-info-main h2 {
            margin: 0;
            font-size: 1.5rem;
        }

        .seller-info-main p {
            margin: 5px 0 0;
            opacity: 0.8;
            font-size: 0.9rem;
        }

        .seller-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            padding: 20px;
        }

        @media (max-width: 600px) {
            .seller-stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        .seller-search-bar {
            padding: 15px 20px;
        }

        .seller-search-input-wrapper {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.1);
            padding: 12px 15px;
            border-radius: 10px;
            flex: 1;
        }

        .seller-search-input-wrapper i {
            color: rgba(255, 255, 255, 0.5);
        }

        .seller-search-input {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
            font-size: 0.95rem;
        }

        .seller-search-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .seller-products-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            padding: 15px 20px;
            max-height: 400px;
            overflow-y: auto;
        }

        @media (max-width: 500px) {
            .seller-products-grid {
                grid-template-columns: 1fr;
            }
        }

        .seller-product-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .seller-product-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border-color: rgba(102, 126, 234, 0.5);
        }

        .seller-product-image {
            position: relative;
            height: 120px;
            overflow: hidden;
        }

        .seller-product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .seller-product-card:hover .seller-product-image img {
            transform: scale(1.05);
        }

        .seller-product-status {
            position: absolute;
            top: 8px;
            left: 8px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            backdrop-filter: blur(5px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .seller-product-status.active {
            background: linear-gradient(135deg, #4ade80, #22c55e);
            color: #1a1a2e;
        }

        .seller-product-status.sold {
            background: linear-gradient(135deg, #fb923c, #f97316);
            color: #1a1a2e;
        }

        .seller-product-status.draft {
            background: #6b7280;
            color: white;
        }

        .seller-product-info {
            padding: 12px;
            color: white;
            background: rgba(0, 0, 0, 0.2);
        }

        .seller-product-info h4,
        .seller-product-name {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 600;
            color: white;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .seller-product-price {
            color: #4ade80;
            font-weight: 700;
            font-size: 1.1rem;
            margin-top: 5px;
        }

        .seller-product-stats {
            display: flex;
            gap: 15px;
            margin-top: 8px;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .seller-product-stats i {
            margin-right: 3px;
        }

        .seller-product-actions {
            display: flex;
            gap: 8px;
            padding: 10px 12px;
            background: rgba(0, 0, 0, 0.3);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .seller-product-actions button {
            flex: 1;
            padding: 8px 10px;
            border: none;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }

        .seller-product-actions .edit-btn:hover {
            background: linear-gradient(135deg, #4ade80, #22c55e);
            color: #1a1a2e;
        }

        .seller-product-actions .delete-btn {
            flex: none;
            width: 40px;
            background: rgba(239, 68, 68, 0.2);
        }

        .seller-product-actions .delete-btn:hover {
            background: #ef4444;
        }

        .seller-badge-row {
            display: flex;
            gap: 10px;
            margin-top: 8px;
            flex-wrap: wrap;
        }

        .seller-verified-badge {
            background: rgba(74, 222, 128, 0.2);
            color: #4ade80;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .seller-member-since {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.75rem;
        }

        .seller-share-btn {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s;
        }

        .seller-share-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }

        /* Quick Actions */
        .seller-quick-actions {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            padding: 15px 20px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sq-action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 15px 10px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            text-decoration: none;
            font-size: 0.8rem;
            transition: all 0.3s;
            cursor: pointer;
        }

        .sq-action-btn i {
            font-size: 1.3rem;
        }

        .sq-action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .sq-action-btn.primary {
            background: linear-gradient(135deg, #00B900, #06C755);
            border: none;
        }

        .sq-action-btn.primary:hover {
            box-shadow: 0 5px 20px rgba(0, 185, 0, 0.4);
        }

        /* Enhanced Stats */
        .seller-stat-card {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stat-icon {
            width: 45px;
            height: 45px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            color: white;
        }

        .stat-info {
            display: flex;
            flex-direction: column;
        }

        .seller-stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            line-height: 1;
        }

        .seller-stat-label {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.6);
            margin-top: 4px;
        }

        /* Alerts */
        .seller-alerts {
            padding: 0 20px;
        }

        .seller-alert {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(96, 165, 250, 0.1);
            border: 1px solid rgba(96, 165, 250, 0.3);
            border-radius: 10px;
            padding: 12px 15px;
            margin-bottom: 10px;
            color: white;
            font-size: 0.9rem;
        }

        .seller-alert i {
            font-size: 1.2rem;
            color: #60a5fa;
        }

        .seller-alert.success {
            background: rgba(74, 222, 128, 0.1);
            border-color: rgba(74, 222, 128, 0.3);
        }

        .seller-alert.success i {
            color: #4ade80;
        }

        .seller-alert.warning {
            background: rgba(251, 146, 60, 0.1);
            border-color: rgba(251, 146, 60, 0.3);
        }

        .seller-alert.warning i {
            color: #fb923c;
        }

        /* Enhanced Search */
        .seller-search-bar {
            display: flex;
            gap: 10px;
            padding: 15px 20px;
            align-items: center;
        }

        .seller-sort-select {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 10px 15px;
            border-radius: 10px;
            font-size: 0.9rem;
        }

        /* Tabs Enhancement */
        .seller-tabs {
            padding: 0 20px;
            display: flex;
            gap: 5px;
            margin-bottom: 15px;
        }

        .seller-tab {
            flex: 1;
            padding: 12px;
            border: none;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.7);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 0.9rem;
        }

        .seller-tab.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }

        .seller-tab i {
            margin-right: 5px;
        }

        /* Bottom Actions */
        .seller-bottom-actions {
            display: flex;
            gap: 10px;
            padding: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .btn-post-main {
            flex: 1;
        }

        .btn-help {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-help:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 600px) {
            .seller-quick-actions {
                grid-template-columns: repeat(2, 1fr);
            }

            .seller-stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>

    <!-- AI Modal -->
    <div class="ai-modal-overlay" id="aiModal">
        <div class="ai-modal">
            <div class="ai-modal-header" style="position: relative;">
                <button class="ai-modal-close" onclick="closeAIModal()">
                    <i class="fas fa-times"></i>
                </button>
                <!-- เปลี่ยนจากไอคอน Font Awesome เป็นแท็ก img (decorative) -->
                <h3>
                    <img src="/assets/images/logo.png" alt="" aria-hidden="true" class="tuktuk-icon">
                    <span class="ai-title-text">Tuktuk AI ช่วยสร้างโพสต์ขาย</span>
                </h3>
                <p>ส่งรูปสินค้า ให้เราช่วยเขียนข้อความขาย</p>
            </div>
            <div class="ai-modal-body">
                <!-- Upload Section -->
                <div id="aiUploadSection">
                    <div class="ai-upload-area" id="aiUploadArea"
                        onclick="document.getElementById('aiFileInput').click()">
                        <div class="ai-upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="ai-upload-text">
                            <strong>คลิกหรือลากรูปมาวาง</strong>
                            <small>รองรับ JPG, PNG ขนาดไม่เกิน 5MB</small>
                        </div>
                    </div>
                    <input type="file" id="aiFileInput" accept="image/*" style="display: none;"
                        onchange="handleImageSelect(event)">

                    <!-- Preview -->
                    <div class="ai-preview-container" id="aiPreviewContainer">
                        <img id="aiPreviewImage" class="ai-preview-image" src="" alt="Preview">
                        <button class="ai-new-btn" onclick="resetAIUpload()">
                            <i class="fas fa-redo"></i> เลือกรูปใหม่
                        </button>
                    </div>

                    <!-- Extra Info -->
                    <div class="ai-extra-info">
                        <label><i class="fas fa-info-circle"></i> ข้อมูลเพิ่มเติม (ไม่บังคับ)</label>
                        <textarea id="aiExtraInfo" rows="2"
                            placeholder="เช่น ราคา, สภาพสินค้า, รายละเอียดพิเศษ..."></textarea>
                    </div>

                    <button class="ai-generate-btn" id="aiGenerateBtn" onclick="generateAIPost()" disabled>
                        <i class="fas fa-sparkles"></i> สร้างข้อความขาย
                    </button>
                </div>

                <!-- Loading -->
                <div class="ai-loading" id="aiLoading">
                    <div class="ai-loading-spinner"></div>
                    <p> ระบบ กำลังวิเคราะห์รูปภาพ...</p>
                    <small>กรุณารอสักครู่</small>
                </div>

                <!-- Result -->
                <div class="ai-result" id="aiResult">
                    <div class="ai-result-header">
                        <i class="fas fa-check-circle"></i>
                        <h4>Tuktuk AI สร้างข้อความเสร็จแล้ว!</h4>
                    </div>

                    <div class="ai-product-info">
                        <div class="ai-info-item">
                            <label>📦 สินค้า</label>
                            <span id="aiProductName">-</span>
                        </div>
                        <div class="ai-info-item price">
                            <label>💰 ราคาแนะนำ</label>
                            <span id="aiSuggestedPrice">-</span>
                        </div>
                        <div class="ai-info-item">
                            <label>📁 หมวดหมู่</label>
                            <span id="aiCategory">-</span>
                        </div>
                        <div class="ai-info-item">
                            <label>✨ อีโมจิ</label>
                            <span id="aiEmojis">-</span>
                        </div>
                    </div>

                    <div class="ai-post-content">
                        <div class="ai-post-title" id="aiPostTitle"></div>
                        <div class="ai-post-description" id="aiPostDescription"></div>
                        <div class="ai-post-cta" id="aiPostCta"></div>
                        <div class="ai-post-hashtags" id="aiPostHashtags"></div>
                    </div>

                    <!-- Usage Badge -->
                    <div class="ai-usage-badge" id="aiUsageBadge">
                        <span id="aiUsageText">🎁 ใช้ฟรีคงเหลือ: 3/3 ครั้ง</span>
                        <a href="https://lin.ee/1YJsw47" target="_blank"
                            style="color:#667eea;text-decoration:none;font-weight:600;">
                            <i class="fab fa-line"></i> เป็นสมาชิก
                        </a>
                    </div>

                    <div class="ai-actions">
                        <button class="ai-copy-btn" onclick="copyAIPost()">
                            <i class="fas fa-copy"></i> คัดลอก
                        </button>
                        <button class="ai-share-btn" onclick="shareToLine()">
                            <i class="fab fa-line"></i> แชร์ LINE
                        </button>
                    </div>

                    <!-- New Action Buttons -->
                    <div class="ai-actions-row">
                        <button class="ai-post-btn" id="aiSellBtn" onclick="postToMarketplace()">
                            <i class="fas fa-store"></i> ลงขายสินค้า
                        </button>
                        <button class="ai-fb-btn" onclick="shareToFacebookPost()">
                            <i class="fab fa-facebook-f"></i> โพสต์ Facebook
                        </button>
                    </div>

                    <button class="ai-new-btn" onclick="resetAIGenerator()">
                        <i class="fas fa-redo"></i> สร้างใหม่อีกครั้ง
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div class="ai-toast" id="aiToast"></div>

    <!-- Admin Ads FAB Button (Super Admin Only) -->
    <button class="admin-ads-fab" id="adminAdsFab" onclick="openAdminAdsModal()" title="จัดการโฆษณา">
        <i class="fas fa-ad"></i>
    </button>

    <!-- Admin Ads Management Modal -->
    <div class="admin-ads-modal-overlay" id="adminAdsModal">
        <div class="admin-ads-modal">
            <div class="admin-ads-header">
                <h3><i class="fas fa-bullhorn"></i> จัดการโฆษณา & โปรโมชั่น</h3>
                <button class="admin-ads-close" onclick="closeAdminAdsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="admin-ads-body">
                <!-- Tabs -->
                <div class="admin-ads-tabs">
                    <button class="admin-ads-tab active" id="tabBtnCreate" onclick="switchAdsTab('create')">
                        <i class="fas fa-plus-circle"></i> เพิ่มใหม่
                    </button>
                    <button class="admin-ads-tab" id="tabBtnList" onclick="switchAdsTab('list')">
                        <i class="fas fa-list"></i> รายการโฆษณา
                    </button>
                </div>

                <!-- Create Tab -->
                <div class="ads-tab-content" id="adsTabCreate">
                    <form id="createAdForm" onsubmit="handleCreateAd(event)">
                        <div class="ad-form-row">
                            <div class="ad-form-group flex-2">
                                <label><i class="fas fa-tag"></i> ชื่อโฆษณา</label>
                                <input type="text" class="ad-form-input" id="adTitle"
                                    placeholder="โปรโมชั่นสินค้าลดราคา 50%" required>
                            </div>
                            <div class="ad-form-group flex-1">
                                <label><i class="fas fa-layer-group"></i> ประเภท</label>
                                <select class="ad-form-select" id="adType">
                                    <option value="banner">🖼️ Banner Slider</option>
                                    <option value="card">🃏 Promo Card</option>
                                </select>
                            </div>
                        </div>

                        <div class="ad-form-group">
                            <label><i class="fas fa-align-left"></i> รายละเอียด (แสดงเฉพาะบน Card)</label>
                            <textarea class="ad-form-input" id="adDescription" rows="2"
                                placeholder="รายละเอียดโปรโมชั่น..."></textarea>
                        </div>

                        <div class="ad-form-group">
                            <label><i class="fas fa-image"></i> รูปภาพโฆษณา</label>
                            <div class="ad-image-upload" id="adUploadArea"
                                onclick="document.getElementById('adFileSelect').click()">
                                <div id="adUploadPlaceholder">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p style="margin: 0; font-weight: 600; color: #666;">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                    <small class="text-muted">แนะนำ: 1200x400 (Banner) หรือ 400x400 (Card)</small>
                                </div>
                                <div id="adImagePreviewWrapper" class="ad-image-preview-wrapper" style="display: none;"
                                    onclick="event.stopPropagation()">
                                    <img id="adImagePreview" class="ad-image-preview" src="" alt="Preview">
                                    <button type="button" class="clear-image-btn" onclick="clearAdImage()">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <input type="file" id="adFileSelect" accept="image/*" style="display: none;"
                                onchange="handleAdFileSelect(event)">
                            <input type="hidden" id="adImageUrl">
                        </div>

                        <div class="ad-form-group">
                            <label><i class="fas fa-link"></i> ลิงก์ปลายทาง (URL)</label>
                            <input type="url" class="ad-form-input" id="adTargetUrl"
                                placeholder="https://tuktukfeed.com/promotions/...">
                        </div>

                        <div class="ad-form-row">
                            <div class="ad-form-group">
                                <label><i class="fas fa-calendar-alt"></i> เริ่มวันที่</label>
                                <input type="date" class="ad-form-input" id="adStartDate">
                            </div>
                            <div class="ad-form-group">
                                <label><i class="fas fa-calendar-times"></i> สิ้นสุดวันที่</label>
                                <input type="date" class="ad-form-input" id="adEndDate">
                            </div>
                            <div class="ad-form-group">
                                <label><i class="fas fa-sort-numeric-up"></i> ลำดับ</label>
                                <input type="number" class="ad-form-input" id="adOrder" value="0" min="0">
                            </div>
                        </div>

                        <div class="ad-form-group">
                            <label><i class="fas fa-building"></i> ชื่อผู้สนับสนุน (Optional)</label>
                            <input type="text" class="ad-form-input" id="adSponsor"
                                placeholder="Sponsored by TukTuk Ecosystem">
                        </div>

                        <input type="hidden" id="editingAdId" value="">

                        <button type="submit" class="ad-submit-btn" id="adSubmitBtn">
                            <i class="fas fa-paper-plane"></i> บันทึกโฆษณา
                        </button>
                    </form>
                </div>

                <!-- List Tab -->
                <div class="ads-tab-content" id="adsTabList" style="display: none;">
                    <div class="ads-empty-state" id="adsEmptyState">
                        <i class="fas fa-ad"></i>
                        <p>ยังไม่มีโฆษณา</p>
                        <small>กดปุ่ม "เพิ่มใหม่" เพื่อสร้างโฆษณา</small>
                    </div>
                    <div class="ads-list" id="adsList">
                        <!-- Ads items loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- AOS JS -->
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

    <script>
        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyD92Lw0vd32ce6m4J2nBVBWZRYBy4aDB_s",
            authDomain: "appinjproject.firebaseapp.com",
            projectId: "appinjproject",
            storageBucket: "appinjproject.firebasestorage.app",
            messagingSenderId: "408718656984",
            appId: "1:408718656984:web:76e9cc7a89e9b4c9d5a8ab"
        };

        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const db = firebase.firestore();

        // Optimize connection settings - Fix for "Could not reach Cloud Firestore backend"
        try {
            db.settings({
                experimentalForceLongPolling: true
            });
            console.log('✅ Firestore settings updated: Force Long Polling enabled');
        } catch (e) {
            console.warn('⚠️ Could not set Firestore settings:', e);
        }

        const storage = firebase.storage();

        // Enable Firestore offline persistence
        db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Browser doesn\'t support persistence');
                }
            });

        // State
        let lineUserId = ''; // Declare lineUserId at top level

        // Super Admin IDs
        const SUPER_ADMIN_IDS = [
            'Ud9bec6d2ea945cf4330a69cb74ac93cf'  // Super Admin หลัก
        ];

        function checkIsSuperAdmin(userId) {
            return SUPER_ADMIN_IDS.includes(userId);
        }

        let allProducts = [];
        let filteredProducts = [];
        let lastProductDoc = null; // Pagination state
        let lastCommunityDoc = null;
        let isSecondhandLoading = false;
        let isCommunityLoading = false;
        const PAGE_LIMIT = 24; // Optimized page size for grid

        let allCommunityProducts = []; // Moved here for clarity
        let currentCommunityCategory = 'all';

        let currentCategory = 'all';
        let searchQuery = '';
        let currentSort = 'newest';
        let currentPriceFilter = 'all';
        let currentSellerId = null; // Filter logic for seller shops
        let wishlist = JSON.parse(localStorage.getItem('tuktuk_wishlist') || '[]');
        let currentViewProduct = null;
        let selectedAdFile = null; // เก็บไฟล์รูปโฆษณาที่เลือก

        // Initialize AOS
        AOS.init({
            duration: 600,
            easing: 'ease-out',
            once: true
        });

        // Format price
        function formatPrice(price) {
            return new Intl.NumberFormat('th-TH').format(price);
        }

        // Mask phone number
        function maskPhoneNumber(phone) {
            if (!phone) return 'ไม่ระบุ';
            return phone.length > 6 ? phone.substring(0, 6) + '****' : phone;
        }

        // Check saved session (Helper for checkSuperAdmin)
        async function checkSavedSession() {
            try {
                // Check sessionStorage first
                let userId = sessionStorage.getItem('lineUserId');
                if (userId) return { lineUserId: userId };

                // Then localStorage
                userId = localStorage.getItem('lineUserId');
                if (userId) return { lineUserId: userId };

                return null;
            } catch (error) {
                console.error('Error checking saved session:', error);
                return null;
            }
        }


        // Toggle Footer
        function toggleFooter(id) {
            const footer = document.getElementById(id);
            if (!footer) return;

            const isCollapsed = footer.classList.toggle('collapsed');
            const icon = footer.querySelector('.footer-toggle-btn i');

            if (icon) {
                if (isCollapsed) {
                    icon.className = 'fas fa-chevron-down';
                } else {
                    icon.className = 'fas fa-chevron-up';
                }
            }

            // Save preference
            localStorage.setItem(`footer_${id}_collapsed`, isCollapsed);
        }

        // Initialize Footer State
        function initFooterState(id) {
            const footer = document.getElementById(id);
            if (!footer) return;

            const savedState = localStorage.getItem(`footer_${id}_collapsed`);
            // Default to collapsed for both to save space as requested
            if (savedState === 'true' || savedState === null) {
                footer.classList.add('collapsed');
                const icon = footer.querySelector('.footer-toggle-btn i');
                if (icon) icon.className = 'fas fa-chevron-down';
            } else {
                footer.classList.remove('collapsed');
                const icon = footer.querySelector('.footer-toggle-btn i');
                if (icon) icon.className = 'fas fa-chevron-up';
            }
        }

        // Get time ago
        function getTimeAgo(timestamp) {
            if (!timestamp) return '';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diff = now - date;

            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
            if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
            if (days < 7) return `${days} วันที่แล้ว`;
            return date.toLocaleDateString('th-TH');
        }

        // Check if product is new (within 24 hours)
        function isNewProduct(timestamp) {
            if (!timestamp) return false;
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            return diff < 86400000; // 24 hours
        }

        // Check if product is hot (many views)
        function isHotProduct(viewCount) {
            return viewCount >= 50;
        }

        // Share product card
        function shareProductCard(event, productId) {
            if (event) event.stopPropagation();
            if (!productId) return;

            const shareUrl = `https://tuktukfeed.com/product?id=${productId}`;

            if (navigator.share) {
                navigator.share({
                    title: 'TukTuk Marketplace',
                    text: 'Check out this product!',
                    url: shareUrl
                }).then(() => {
                    console.log('Shared successfully');
                }).catch((error) => {
                    console.log('Error sharing:', error);
                });
            } else {
                // Fallback
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showToast('📋 คัดลอกลิงก์แล้ว!', 'success');
                }).catch(() => {
                    prompt('Copy this link:', shareUrl);
                });
            }
        }

        // Check if current user is owner or admin
        function canManageProduct(product) {
            const currentLineUserId = lineUserId || sessionStorage.getItem('lineUserId');
            const isOwner = currentLineUserId && product.lineUserId === currentLineUserId;
            const isAdmin = localStorage.getItem('tuktuk_admin_role') === 'true';
            return { isOwner, isAdmin, canManage: isOwner || isAdmin };
        }

        // ========================================
        // PRODUCT ACTIONS & NAVIGATION
        // ========================================

        // View product details (function defined later in code)

        // Edit product
        function editProduct(productId) {
            if (!productId) return;
            window.location.href = `post-product.html?edit=${productId}`;
        }

        // Confirm Delete
        function confirmDeleteProduct(event, productId, isAdmin) {
            if (event) event.stopPropagation();

            Swal.fire({
                title: 'ยืนยันการลบ?',
                text: "คุณไม่สามารถกู้คืนสินค้านี้ได้หลังจากการลบ",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#3b82f6',
                confirmButtonText: 'ใช่, ลบเลย!',
                cancelButtonText: 'ยกเลิก',
                background: '#ffffff',
                customClass: {
                    title: 'swal-title',
                    content: 'swal-text'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteProduct(productId);
                }
            });
        }

        // Delete Product
        async function deleteProduct(productId) {
            try {
                showLoading(); // Show global loading
                await db.collection('marketplace_items').doc(productId).update({
                    status: 'deleted',
                    deletedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                hideLoading();
                Swal.fire(
                    'ลบสำเร็จ!',
                    'สินค้าของคุณถูกลบเรียบร้อยแล้ว',
                    'success'
                );

                // Remove from local list and UI without full reload
                allProducts = allProducts.filter(p => p.id !== productId);
                const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                if (card) card.remove();

                updateStats();

            } catch (error) {
                hideLoading();
                console.error('Error deleting product:', error);
                showToast('เกิดข้อผิดพลาดในการลบสินค้า', 'error');
            }
        }

        // Mark as Sold
        function markAsSold(event, productId) {
            if (event) event.stopPropagation();

            Swal.fire({
                title: 'ยืนยันขายแล้ว?',
                text: "สินค้านี้จะถูกเปลี่ยนสถานะเป็น 'ขายแล้ว'",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#cbd5e1',
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await db.collection('marketplace_items').doc(productId).update({
                            status: 'sold',
                            soldAt: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        showToast('🎉 ยินดีด้วย! สินค้าขายออกแล้ว', 'success');
                        setTimeout(() => loadProducts(), 1000); // Reload to update UI

                    } catch (error) {
                        console.error('Error marking sold:', error);
                        showToast('เกิดข้อผิดพลาด', 'error');
                    }
                }
            });
        }

        // Helper for quick global loading
        function showLoading() {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'flex';
        }
        function hideLoading() {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
        }

        // Render product card
        function renderProductCard(product) {
            let badge = '';
            if (product.status === 'sold') {
                badge = '<span class="product-badge badge-sold">ขายแล้ว</span>';
            } else if (isNewProduct(product.createdAt)) {
                badge = '<span class="product-badge badge-new">ใหม่</span>';
            } else if (isHotProduct(product.viewCount || 0)) {
                badge = '<span class="product-badge badge-hot">ฮิต</span>';
            }

            const wishlistClass = isInWishlist(product.id) ? 'active' : '';
            const { isOwner, isAdmin, canManage } = canManageProduct(product);


            // สร้างปุ่มจัดการ (แชร์, แก้ไข, ขายแล้ว, ลบ)
            let actionsHtml = `
                <div class="product-actions ${canManage ? 'always-show' : ''}">
                    ${isOwner ? `
                        <button class="action-btn edit-btn" onclick="event.stopPropagation(); editProduct('${product.id}')" title="แก้ไขสินค้า">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn share-btn" onclick="shareProductCard(event, '${product.id}')" title="แชร์สินค้า">
                        <i class="fas fa-share-alt"></i>
                    </button>`;

            // ปุ่มขายแล้ว (เฉพาะเจ้าของ และยังไม่ขาย)
            if (isOwner && product.status !== 'sold') {
                actionsHtml += `
                    <button class="action-btn sold-btn" onclick="markAsSold(event, '${product.id}')" title="ขายแล้ว">
                        <i class="fas fa-check-circle"></i>
                    </button>`;
            }

            // ปุ่มลบ (เจ้าของหรือแอดมิน)
            if (canManage) {
                actionsHtml += `
                    <button class="action-btn delete-btn" onclick="confirmDeleteProduct(event, '${product.id}', ${isAdmin && !isOwner})" title="ลบสินค้า">
                        <i class="fas fa-trash-alt"></i>
                    </button>`;
            }

            actionsHtml += '</div>';

            return `
                <div class="product-card" data-product-id="${product.id}" data-seller-id="${product.lineUserId || ''}">
                    <div class="product-image" onclick="viewProduct('${product.id}')" style="cursor: pointer;">
                        <img src="${product.imageUrl || 'https://placehold.co/300x300?text=No+Image'}" 
                             alt="${product.productName}"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=No+Image'">
                        ${badge}
                        <div class="product-location-badge">
                            <i class="fas fa-map-marker-alt"></i> ${product.sellerLocation || 'ไม่ระบุ'}
                        </div>
                        ${actionsHtml}
                        <button class="product-wishlist ${wishlistClass}" onclick="toggleWishlist(event, '${product.id}')" title="เพิ่มในรายการโปรด">
                            <i class="${wishlistClass ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <div class="product-image-overlay">
                            <button class="product-quick-view" onclick="openQuickView(event, '${product.id}')">
                                <i class="fas fa-eye"></i> ดูด่วน
                            </button>
                        </div>
                    </div>
                    <div class="product-info" onclick="viewProduct('${product.id}')">
                        <div class="product-name" title="${product.productName}">${product.productName}</div>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <div class="product-price">฿${formatPrice(product.price)}</div>
                            <div class="product-views">
                                <i class="fas fa-eye"></i> ${product.viewCount || 0}
                            </div>
                        </div>
                        <div class="product-meta mt-2 pt-2 border-top">
                            <div class="product-seller" style="cursor:pointer; position:relative; z-index:10;" 
                                 onclick="event.stopPropagation(); event.preventDefault(); filterBySeller('${product.lineUserId}', '${(product.sellerName || 'ผู้ขาย').replace(/'/g, "\\'")}');" 
                                 title="เข้าชมร้านค้า">
                                ${product.sellerPictureUrl
                    ? `<img src="${product.sellerPictureUrl}" class="seller-avatar-mini" alt="Seller">`
                    : `<i class="fas fa-user-circle"></i>`}
                                <span class="seller-name-text">${product.sellerName || 'ผู้ขาย'}</span>
                            </div>
                            <div class="product-time text-muted" style="font-size: 0.65rem;">
                                ${getTimeAgo(product.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Render skeleton loaders for better UX
        function renderSkeletons(count = 8) {
            const skeletons = Array(count).fill(0).map(() => `
                <div class="product-card skeleton-card">
                    <div class="product-image skeleton-shimmer"></div>
                    <div class="product-info">
                        <div class="skeleton-shimmer" style="height: 16px; width: 80%; margin-bottom: 10px; border-radius: 4px;"></div>
                        <div class="d-flex justify-content-between">
                            <div class="skeleton-shimmer" style="height: 20px; width: 40%; border-radius: 4px;"></div>
                            <div class="skeleton-shimmer" style="height: 14px; width: 20%; border-radius: 4px;"></div>
                        </div>
                        <div class="mt-3 pt-2 border-top">
                            <div class="skeleton-shimmer" style="height: 24px; width: 100%; border-radius: 20px;"></div>
                        </div>
                    </div>
                </div>
            `).join('');

            return `
                <div class="product-grid">
                    ${skeletons}
                </div>
            `;
        }

        // Render community skeletons
        function renderCommunitySkeletons(count = 6) {
            return Array(count).fill(0).map(() => `
                <div class="community-product-card skeleton-card">
                    <div class="community-product-image skeleton-shimmer" style="height: 200px;"></div>
                    <div class="community-product-info">
                        <div class="skeleton-shimmer" style="height: 14px; width: 100px; margin-bottom: 8px;"></div>
                        <div class="skeleton-shimmer" style="height: 20px; width: 150px; margin-bottom: 10px;"></div>
                        <div class="skeleton-shimmer" style="height: 40px; width: 100%; border-radius: 8px;"></div>
                    </div>
                </div>
            `).join('');
        }

        // Render empty state
        function renderEmptyState(message, showRetry = false, retryFn = 'loadProducts()') {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h3>ไม่พบข้อมูล</h3>
                    <p>${message}</p>
                    ${showRetry ? `
                        <button class="btn btn-primary mt-3 px-4 py-2 rounded-pill" onclick="${retryFn}">
                            <i class="fas fa-redo me-2"></i> ลองใหม่อีกครั้ง
                        </button>
                    ` : ''}
                </div>
            `;
        }

        // Render products
        function renderProducts(products) {
            const container = document.getElementById('productContainer');

            // Update filter count
            document.getElementById('filterCount').textContent = products.length;

            if (products.length === 0) {
                container.innerHTML = renderEmptyState(
                    searchQuery
                        ? `ไม่พบสินค้าที่ตรงกับ "${searchQuery}"`
                        : 'ยังไม่มีสินค้าในหมวดหมู่นี้'
                );
                return;
            }

            const viewMode = document.getElementById('gridView').classList.contains('active') ? 'grid' : 'list';
            const gridClass = viewMode === 'list' ? 'product-grid list-view' : 'product-grid';

            try {
                const cardsHtml = products.map((p, i) => {
                    return renderProductCard(p);
                }).join('');
                console.log('🛒 Generated HTML length:', cardsHtml.length);
                console.log('🛒 HTML preview:', cardsHtml.substring(0, 500));

                container.innerHTML = `
                    <div class="${gridClass}">
                        ${cardsHtml}
                    </div>
                `;
                console.log('🛒 Container innerHTML set, children:', container.children.length);
            } catch (err) {
                console.error('🛒 Error rendering products:', err);
            }

            // Reinitialize AOS for new elements
            AOS.refresh();
        }

        // Filter products
        function filterProducts() {
            let filtered = [...allProducts];

            // Filter by seller (Priority filter)
            if (currentSellerId) {
                filtered = filtered.filter(p => p.lineUserId === currentSellerId);
            }

            // Filter by category
            if (currentCategory !== 'all') {
                filtered = filtered.filter(p => {
                    const tags = p.tags || [];
                    return tags.some(tag => tag.toLowerCase().includes(currentCategory.toLowerCase()));
                });
            }

            // Filter by search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(p => {
                    const name = (p.productName || '').toLowerCase();
                    const tags = (p.tags || []).join(' ').toLowerCase();
                    const desc = (p.description || '').toLowerCase();
                    return name.includes(query) || tags.includes(query) || desc.includes(query);
                });
            }

            // Filter by price
            if (currentPriceFilter !== 'all') {
                filtered = filtered.filter(p => {
                    const price = p.price || 0;
                    switch (currentPriceFilter) {
                        case '0-100': return price <= 100;
                        case '100-500': return price > 100 && price <= 500;
                        case '500-1000': return price > 500 && price <= 1000;
                        case '1000-5000': return price > 1000 && price <= 5000;
                        case '5000+': return price > 5000;
                        default: return true;
                    }
                });
            }

            // Sort products
            switch (currentSort) {
                case 'newest':
                    filtered.sort((a, b) => {
                        const dateA = a.createdAt?.toDate?.() || new Date(0);
                        const dateB = b.createdAt?.toDate?.() || new Date(0);
                        return dateB - dateA;
                    });
                    break;
                case 'price-low':
                    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
                    break;
                case 'price-high':
                    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
                    break;
                case 'popular':
                    filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
                    break;
            }

            filteredProducts = filtered;
            renderProducts(filtered);
        }

        // Sort products handler
        function sortProducts() {
            currentSort = document.getElementById('sortSelect').value;
            filterProducts();
        }

        // Filter by price handler
        function filterByPrice() {
            currentPriceFilter = document.getElementById('priceFilter').value;
            filterProducts();
        }

        // Filter by Quick Category (brand search)
        function filterByQuickCat(brand) {
            // Update active card
            document.querySelectorAll('.category-card').forEach(card => {
                card.classList.toggle('active', card.dataset.cat === brand);
            });

            if (brand === 'all') {
                searchQuery = '';
                document.getElementById('searchInput').value = '';
                const titleText = document.getElementById('sectionTitleText');
                titleText.textContent = '🛒 สินค้าทั้งหมด';
            } else {
                searchQuery = brand;
                document.getElementById('searchInput').value = brand;

                // Update title
                const titleText = document.getElementById('sectionTitleText');
                const brandNames = {
                    'iphone': 'iPhone',
                    'samsung': 'Samsung',
                    'xiaomi': 'Xiaomi',
                    'oppo': 'OPPO',
                    'vivo': 'Vivo',
                    'macbook': 'MacBook',
                    'ipad': 'iPad',
                    'airpods': 'หูฟัง/AirPods'
                };
                titleText.textContent = `🔍 ค้นหา "${brandNames[brand] || brand}"`;
            }

            // Scroll to products
            document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });

            filterProducts();
        }

        // Filter by Seller handler
        function filterBySeller(sellerId, name = null) {
            console.log('🛍️ Filtering by Seller ID:', sellerId, 'Name:', name);
            if (!sellerId || sellerId === 'undefined') {
                console.warn('⚠️ Invalid Seller ID');
                return;
            }

            // Reset other filters
            currentCategory = 'all';
            searchQuery = '';
            currentSellerId = sellerId;

            // Update UI State
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.category-tab[data-category="all"]').forEach(t => t.classList.add('active'));
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';

            // Update Title
            const sellerName = name || 'ผู้ขาย';
            const titleEl = document.getElementById('sectionTitleText');
            if (titleEl) {
                titleEl.innerHTML = `🛍️ ร้านค้าของ <span style="color:var(--primary);">${sellerName}</span>`;
            }

            // Update URL to support sharing/refreshing
            try {
                const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?seller=${sellerId}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
            } catch (e) {
                console.error('Error updating URL:', e);
            }

            // Filter and Scroll
            filterProducts();

            // Scroll to results
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // View seller from Quick View Modal
        function viewSellerFromModal() {
            if (currentViewProduct && currentViewProduct.lineUserId) {
                closeQuickView();
                filterBySeller(currentViewProduct.lineUserId, currentViewProduct.sellerName);
            }
        }

        // Update category counts
        function updateCategoryCounts() {
            const brands = ['iphone', 'samsung', 'xiaomi', 'oppo', 'vivo', 'macbook', 'airpods'];

            // All count
            const countAllEl = document.getElementById('countAll');
            if (countAllEl) countAllEl.textContent = allProducts.length + ' รายการ';

            brands.forEach(brand => {
                const count = allProducts.filter(p => {
                    const name = (p.productName || '').toLowerCase();
                    const desc = (p.description || '').toLowerCase();
                    return name.includes(brand) || desc.includes(brand);
                }).length;

                const el = document.getElementById('count' + brand.charAt(0).toUpperCase() + brand.slice(1));
                if (el) el.textContent = count + ' รายการ';
            });
        }

        // View toggle
        function setView(mode) {
            document.getElementById('gridView').classList.toggle('active', mode === 'grid');
            document.getElementById('listView').classList.toggle('active', mode === 'list');

            const grid = document.querySelector('.product-grid');
            if (grid) {
                grid.classList.toggle('list-view', mode === 'list');
            }
        }

        // ========================================
        // WISHLIST FUNCTIONS
        // ========================================

        function isInWishlist(productId) {
            return wishlist.includes(productId);
        }

        function toggleWishlist(event, productId) {
            if (event) event.stopPropagation();
            const btn = event ? event.currentTarget : document.querySelector(`[data-product-id="${productId}"] .product-wishlist`);
            if (!btn) {
                // Background update if UI element not found
                if (isInWishlist(productId)) {
                    wishlist = wishlist.filter(id => id !== productId);
                } else {
                    wishlist.push(productId);
                }
                localStorage.setItem('tuktuk_wishlist', JSON.stringify(wishlist));
                return;
            }
            const icon = btn.querySelector('i');

            if (isInWishlist(productId)) {
                wishlist = wishlist.filter(id => id !== productId);
                btn.classList.remove('active');
                icon.classList.replace('fas', 'far');
                showToast('💔 นำออกจากรายการโปรดแล้ว', 'info');
            } else {
                wishlist.push(productId);
                btn.classList.add('active');
                icon.classList.replace('far', 'fas');
                showToast('❤️ เพิ่มในรายการโปรดแล้ว', 'success');
            }

            localStorage.setItem('tuktuk_wishlist', JSON.stringify(wishlist));
        }

        // ========================================
        // QUICK VIEW FUNCTIONS
        // ========================================

        let currentGalleryImages = [];
        let currentGalleryIndex = 0;

        function openQuickView(event, productId) {
            if (event) event.stopPropagation();
            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            currentViewProduct = product;

            // Setup gallery images
            currentGalleryImages = [];
            if (product.imageUrl) currentGalleryImages.push(product.imageUrl);
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach(img => {
                    if (img && !currentGalleryImages.includes(img)) {
                        currentGalleryImages.push(img);
                    }
                });
            }
            if (currentGalleryImages.length === 0) {
                currentGalleryImages.push('https://placehold.co/400x400?text=No+Image');
            }
            currentGalleryIndex = 0;

            // Set main image
            document.getElementById('quickViewImage').src = currentGalleryImages[0];

            // Create gallery thumbnails
            const galleryContainer = document.getElementById('quickViewGallery');
            if (currentGalleryImages.length > 1) {
                galleryContainer.innerHTML = currentGalleryImages.map((img, index) => `
                    <div class="gallery-thumb ${index === 0 ? 'active' : ''}" onclick="changeGalleryImage(${index})">
                        <img src="${img}" alt="Product ${index + 1}">
                    </div>
                `).join('');
                galleryContainer.style.display = 'flex';
            } else {
                galleryContainer.innerHTML = '';
                galleryContainer.style.display = 'none';
            }

            document.getElementById('quickViewName').textContent = product.productName;
            document.getElementById('quickViewPrice').textContent = '฿' + formatPrice(product.price);
            document.getElementById('quickViewDesc').textContent = product.description || 'ไม่มีรายละเอียด';
            document.getElementById('quickViewSellerName').textContent = product.sellerName || 'ผู้ขาย';

            const sellerAvatar = document.getElementById('quickViewSellerAvatar');
            if (product.sellerPictureUrl) {
                sellerAvatar.innerHTML = `<img src="${product.sellerPictureUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                sellerAvatar.textContent = (product.sellerName || 'A').charAt(0).toUpperCase();
            }

            document.getElementById('quickViewDate').textContent = 'ลงขายเมื่อ ' + timeAgo(product.createdAt);

            // แสดงเบอร์โทรที่ถูกซ่อน (xxxx 4 หลักท้าย)
            const fullPhone = product.sellerPhone || '';
            const maskedPhone = maskPhoneNumber(fullPhone);
            const phoneEl = document.getElementById('quickViewPhone');
            if (phoneEl) {
                phoneEl.textContent = maskedPhone || '-';
                phoneEl.dataset.fullPhone = fullPhone;
            }

            // Reset reveal button
            const revealBtn = document.getElementById('revealPhoneBtn');
            if (revealBtn) {
                revealBtn.style.display = fullPhone ? 'inline-flex' : 'none';
                revealBtn.innerHTML = '<i class="fas fa-eye"></i> ดูเบอร์เต็ม';
                revealBtn.disabled = false;
                revealBtn.style.background = '';
            }

            // แสดง LINE ID
            const lineIdEl = document.getElementById('quickViewLineId');
            const lineIdCont = document.getElementById('quickViewLineIdContainer');
            if (product.sellerLineId) {
                lineIdEl.textContent = product.sellerLineId;
                lineIdCont.style.display = 'flex';
            } else {
                lineIdCont.style.display = 'none';
            }

            // แสดง Facebook Messenger
            const fbEl = document.getElementById('quickViewMessenger');
            const fbCont = document.getElementById('quickViewMessengerContainer');
            if (product.sellerFacebook) {
                fbEl.textContent = product.sellerFacebook;
                fbCont.style.display = 'flex';
            } else {
                fbCont.style.display = 'none';
            }

            // แสดง Location
            const locEl = document.getElementById('quickViewLocation');
            if (locEl) locEl.textContent = product.sellerLocation || 'ไม่ระบุ';

            // Show Modal
            const modal = document.getElementById('quickViewModal');
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Track View
            if (window.tuktukTrackEvent) {
                window.tuktukTrackEvent('quick_view_open', {
                    productId: product.id,
                    productName: product.productName
                });
            }

            // Update Save Button in Modal
            const modalSaveBtn = document.getElementById('saveModalProductBtn');
            if (modalSaveBtn) {
                const isSaved = userSavedItems.some(i => i.id === product.id);
                modalSaveBtn.classList.toggle('active', isSaved);
                const icon = modalSaveBtn.querySelector('i');
                if (icon) icon.className = isSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
            }
        }

        // Gallery functions
        function changeGalleryImage(index) {
            if (index < 0 || index >= currentGalleryImages.length) return;

            currentGalleryIndex = index;
            document.getElementById('quickViewImage').src = currentGalleryImages[index];

            // Update active thumbnail
            document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        }

        // Image Zoom
        function openImageZoom() {
            const img = document.getElementById('quickViewImage');
            document.getElementById('zoomImage').src = img.src;
            document.getElementById('imageZoomModal').classList.add('show');
        }

        function closeImageZoom() {
            document.getElementById('imageZoomModal').classList.remove('show');
        }

        // ฟังก์ชันซ่อนเบอร์โทร (แสดงเฉพาะ 3 หลักแรกและ xxxx)
        function maskPhoneNumber(phone) {
            if (!phone || phone.length < 7) return phone;
            // แสดง 3 หลักแรก + xxxx
            return phone.substring(0, 3) + '-xxx-xxxx';
        }

        // ฟังก์ชันเปิดเผยเบอร์โทร (ต้องมี PIN)
        async function revealPhone() {
            const revealBtn = document.getElementById('revealPhoneBtn');
            const phoneSpan = document.getElementById('quickViewPhone');
            const fullPhone = phoneSpan.dataset.fullPhone;

            if (!fullPhone) return;

            // ตรวจสอบว่า login แล้วหรือยัง
            const savedSession = await checkSavedSession();
            if (!savedSession || !savedSession.lineUserId) {
                showToast('กรุณาขอ PIN จาก LINE OA เพื่อดูเบอร์เต็ม', 'error');
                // แสดงลิงก์ LINE OA
                if (confirm('คุณต้องขอ PIN จาก LINE OA ก่อน\n\nกด OK เพื่อเพิ่มเพื่อน LINE OA')) {
                    window.open('https://lin.ee/1YJsw47', '_blank');
                }
                return;
            }

            // แสดงเบอร์เต็ม
            const formattedPhone = fullPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            phoneSpan.textContent = formattedPhone;

            revealBtn.innerHTML = '<i class="fas fa-check"></i> เปิดแล้ว';
            revealBtn.disabled = true;
            revealBtn.style.background = '#28a745';

            showToast('✅ แสดงเบอร์โทรเต็มแล้ว', 'success');
        }

        function closeQuickView(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('quickViewModal').classList.remove('show');
            document.body.style.overflow = '';
        }

        function contactSeller() {
            if (!currentViewProduct) return;

            // สร้างข้อความสำหรับติดต่อผู้ขาย
            const text = `สนใจสินค้า: ${currentViewProduct.productName}\nราคา: ฿${formatPrice(currentViewProduct.price)}`;
            const lineUrl = `https://lin.ee/1YJsw47?text=${encodeURIComponent(text)}`;
            window.open(lineUrl, '_blank');
        }

        // ========================================
        // SHARE FUNCTIONS
        // ========================================

        function shareProduct() {
            document.getElementById('shareMenu').classList.add('show');
        }

        function closeShareMenu() {
            document.getElementById('shareMenu').classList.remove('show');
        }

        function shareToLineApp() {
            if (!currentViewProduct) return;
            const shareUrl = `https://tuktukfeed.com/share?id=${currentViewProduct.id}`;
            const text = `🛒 ${currentViewProduct.productName}\n💰 ราคา ฿${formatPrice(currentViewProduct.price)}\n\n🔗 ดูสินค้าเพิ่มเติมที่ WiT Marketplace\n${shareUrl}`;
            window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, '_blank');
            closeShareMenu();
        }

        function shareToFacebook() {
            if (!currentViewProduct) return;
            // Use Cloud Function for AnyImage style preview
            const shareUrl = `https://tuktukfeed.com/share?id=${currentViewProduct.id}`;
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
            closeShareMenu();
        }

        function shareToTwitter() {
            if (!currentViewProduct) return;
            const text = `🛒 ${currentViewProduct.productName} - ฿${formatPrice(currentViewProduct.price)} #WiTMarketplace`;
            const shareUrl = `https://tuktukfeed.com/share?id=${currentViewProduct.id}`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
            closeShareMenu();
        }

        function copyProductLink() {
            if (!currentViewProduct) return;
            // Use Cloud Function URL for better preview when pasted
            const shareUrl = `https://tuktukfeed.com/share?id=${currentViewProduct.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast('📋 คัดลอกลิงก์สำหรับแชร์แล้ว!', 'success');
                closeShareMenu();
            });
        }

        // ========================================
        // PRODUCT MANAGEMENT FUNCTIONS
        // ========================================

        let pendingConfirmAction = null;
        let pendingProductId = null;

        // แชร์สินค้าจากการ์ด
        function shareProductCard(event, productId) {
            if (event) event.stopPropagation();
            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            currentViewProduct = product;
            shareProduct();
        }

        // เปิด Confirm Modal
        function openConfirmModal(icon, iconClass, title, message, action, btnClass = 'confirm') {
            document.getElementById('confirmIcon').className = `confirm-modal-icon ${iconClass}`;
            document.getElementById('confirmIconI').className = `fas ${icon}`;
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;

            const confirmBtn = document.getElementById('confirmBtn');
            confirmBtn.className = `confirm-btn ${btnClass}`;
            pendingConfirmAction = action;

            document.getElementById('confirmModal').classList.add('show');
        }

        function closeConfirmModal() {
            document.getElementById('confirmModal').classList.remove('show');
            pendingConfirmAction = null;
            pendingProductId = null;
        }

        function executeConfirmAction() {
            if (pendingConfirmAction) {
                pendingConfirmAction();
            }
            closeConfirmModal();
        }

        // แก้ไขสินค้า - นำไปหน้า post-product พร้อม editId
        function editProduct(productId) {
            console.log('📝 Editing product:', productId);
            window.location.href = `post-product.html?editId=${productId}`;
        }

        // Mark as Sold - ขายแล้ว
        function markAsSold(event, productId) {
            if (event) event.stopPropagation();
            pendingProductId = productId;

            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            openConfirmModal(
                'fa-check-circle',
                'success',
                'ยืนยันขายสำเร็จ',
                `ต้องการระบุว่า "${product.productName}" ขายแล้วหรือไม่?`,
                async () => {
                    try {
                        await db.collection('marketplace_items').doc(productId).update({
                            status: 'sold',
                            soldAt: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        // บันทึกประวัติการขาย
                        await db.collection('sales_history').add({
                            productId: productId,
                            productName: product.productName,
                            price: product.price,
                            imageUrl: product.imageUrl,
                            sellerId: product.lineUserId,
                            sellerName: product.sellerName,
                            soldAt: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        showToast('✅ บันทึกการขายสำเร็จ!', 'success');

                        // อัปเดต UI
                        const card = document.querySelector(`[data-product-id="${productId}"]`);
                        if (card) {
                            const imgDiv = card.querySelector('.product-image');
                            const existingBadge = imgDiv.querySelector('.product-badge');
                            if (existingBadge) existingBadge.remove();
                            imgDiv.insertAdjacentHTML('afterbegin', '<span class="product-badge badge-sold">ขายแล้ว</span>');

                            // ซ่อนปุ่มขายแล้ว
                            const soldBtn = card.querySelector('.sold-btn');
                            if (soldBtn) soldBtn.remove();
                        }
                    } catch (error) {
                        console.error('Error marking as sold:', error);
                        showToast('❌ เกิดข้อผิดพลาด', 'error');
                    }
                },
                'confirm'
            );
        }

        // Confirm Delete Product
        function confirmDeleteProduct(event, productId, isAdminDelete = false) {
            if (event) event.stopPropagation();
            pendingProductId = productId;

            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            const title = isAdminDelete ? '🔐 ลบสินค้า (แอดมิน)' : 'ลบสินค้า';
            const message = isAdminDelete
                ? `แอดมิน: ต้องการลบ "${product.productName}" หรือไม่? สินค้าจะถูกลบถาวร`
                : `ต้องการลบ "${product.productName}" หรือไม่? สินค้าจะถูกลบถาวร`;

            openConfirmModal(
                'fa-trash-alt',
                'danger',
                title,
                message,
                async () => {
                    try {
                        await db.collection('marketplace_items').doc(productId).delete();

                        showToast('🗑️ ลบสินค้าสำเร็จ', 'success');

                        // ลบจาก array และ UI
                        allProducts = allProducts.filter(p => p.id !== productId);
                        const card = document.querySelector(`[data-product-id="${productId}"]`);
                        if (card) {
                            card.style.animation = 'fadeOut 0.3s ease';
                            setTimeout(() => card.remove(), 300);
                        }

                        updateStats();
                    } catch (error) {
                        console.error('Error deleting product:', error);
                        showToast('❌ เกิดข้อผิดพลาด', 'error');
                    }
                },
                'danger'
            );
        }

        // ========================================
        // SELLER DASHBOARD FUNCTIONS
        // ========================================
        let myProducts = [];
        let currentSellerTab = 'active';

        // เปิด Seller Dashboard - Redirect to dedicated page
        async function openSellerDashboard() {
            const currentLineUserId = lineUserId || sessionStorage.getItem('lineUserId');
            if (!currentLineUserId) {
                showToast('⚠️ กรุณาเข้าสู่ระบบผ่าน LINE OA ก่อน', 'warning');
                return;
            }

            // Redirect to dedicated seller dashboard page
            window.location.href = 'seller-dashboard.html';
        }

        // Legacy function - keep for backward compatibility
        async function openSellerDashboardModal() {

            // โหลดข้อมูลผู้ขาย
            try {
                // ดึงสินค้าทั้งหมดของผู้ขาย (Query by lineUserId)
                const snapshot = await db.collection('marketplace_items')
                    .where('lineUserId', '==', currentLineUserId)
                    .orderBy('createdAt', 'desc')
                    .get();

                sellerProducts = [];
                snapshot.forEach(doc => {
                    sellerProducts.push({ id: doc.id, ...doc.data() });
                });

                // Load Seller Profile Info
                const shopNameEl = document.getElementById('sellerShopName');
                const shopIdEl = document.getElementById('sellerShopId');
                const avatarEl = document.getElementById('sellerAvatarLarge');
                const memberSinceEl = document.getElementById('sellerMemberSince');

                // ชื่อร้าน: จาก wit_shop_name → lineDisplayName → default
                const shopName = localStorage.getItem('wit_shop_name') || localStorage.getItem('lineDisplayName') || 'ร้านค้าของคุณ';

                // LINE ID: จาก wit_line_id → ถ้าไม่มีแสดง "-"
                const lineIdSaved = localStorage.getItem('wit_line_id');

                // Profile picture
                const profilePic = localStorage.getItem('linePictureUrl');

                // อัปเดต UI
                if (shopNameEl) shopNameEl.textContent = shopName;
                if (shopIdEl) {
                    if (lineIdSaved) {
                        shopIdEl.innerHTML = `<i class="fab fa-line"></i> LINE ID: ${lineIdSaved}`;
                    } else {
                        shopIdEl.innerHTML = `<i class="fab fa-line"></i> LINE ID: <a href="#" onclick="openShopSettings(); return false;" style="color:#4ade80;">เพิ่มใน ตั้งค่าร้าน</a>`;
                    }
                }
                if (profilePic && avatarEl) {
                    avatarEl.innerHTML = `<img src="${profilePic}" style="width:100%; height:100%; border-radius:20px; object-fit:cover;">`;
                }

                // สมาชิกตั้งแต่: ดึงจาก Firestore users collection
                if (memberSinceEl) {
                    try {
                        const userDoc = await db.collection('users').doc(currentLineUserId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            const createdAt = userData.createdAt || userData.registeredAt || userData.firstLoginAt;
                            if (createdAt) {
                                const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
                                const formatted = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
                                memberSinceEl.textContent = `สมาชิกตั้งแต่ ${formatted}`;
                            } else {
                                memberSinceEl.textContent = 'สมาชิกใหม่';
                            }
                        } else {
                            memberSinceEl.textContent = 'สมาชิกใหม่';
                        }
                    } catch (e) {
                        memberSinceEl.textContent = 'สมาชิก';
                    }
                }

                updateSellerDashboardUI();
                showSellerTab('active');

            } catch (error) {
                console.error('Error loading seller data:', error);

                // Fallback: ดึงแบบไม่ sort ถ้า index ยังไม่พร้อม
                try {
                    const fallbackSnapshot = await db.collection('marketplace_items')
                        .where('lineUserId', '==', currentLineUserId)
                        .get();

                    sellerProducts = [];
                    fallbackSnapshot.forEach(doc => {
                        sellerProducts.push({ id: doc.id, ...doc.data() });
                    });

                    // โหลดข้อมูลพื้นฐาน
                    const shopName = localStorage.getItem('wit_shop_name') || localStorage.getItem('lineDisplayName') || 'ร้านค้าของคุณ';
                    document.getElementById('sellerShopName').textContent = shopName;

                    updateSellerDashboardUI();
                    showSellerTab('active');
                } catch (fallbackError) {
                    console.error('Fallback load failed:', fallbackError);
                }
            }
        }

        function updateSellerDashboardUI() {
            const total = sellerProducts.length;
            const active = sellerProducts.filter(p => p.status !== 'sold').length;
            const sold = sellerProducts.filter(p => p.status === 'sold').length;
            const views = sellerProducts.reduce((sum, p) => sum + (p.viewCount || 0), 0);

            document.getElementById('statTotalProducts').textContent = total;
            document.getElementById('statActiveProducts').textContent = active;
            document.getElementById('statSoldProducts').textContent = sold;
            document.getElementById('statTotalViews').textContent = views;

            // อัปเดตตัวเลขที่ Tabs
            document.getElementById('countActive').textContent = active;
            document.getElementById('countSold').textContent = sold;
        }

        // Filter products locally (Search)
        function filterSellerProducts() {
            const searchInput = document.getElementById('sellerSearchInput');
            const query = searchInput ? searchInput.value.toLowerCase() : '';

            const filtered = sellerProducts.filter(p => {
                // รองรับทั้ง productName และ name
                const name = (p.productName || p.name || '').toLowerCase();
                const matchName = name.includes(query);

                // Filter by status tab
                let matchStatus = false;
                if (currentSellerTab === 'active') {
                    matchStatus = p.status === 'active' || (p.status !== 'sold' && p.status !== 'draft');
                } else if (currentSellerTab === 'sold') {
                    matchStatus = p.status === 'sold';
                } else if (currentSellerTab === 'draft') {
                    matchStatus = p.status === 'draft';
                }

                return matchName && matchStatus;
            });
            renderSellerProducts(filtered);
        }

        function closeSellerDashboard(event) {
            // ปิดถ้าคลิกที่ overlay หรือเรียกโดยตรง
            if (!event || event.target.id === 'sellerDashboardModal' || event.target.closest('.seller-close-btn')) {
                document.getElementById('sellerDashboardModal').classList.remove('show');
                document.body.style.overflow = '';
            }
        }

        // ทำเครื่องหมายว่าขายแล้ว (เรียกจาก Dashboard)
        async function markAsSoldDashboard(productId) {
            if (!productId || typeof productId !== 'string') {
                console.error('Invalid productId for markAsSoldDashboard:', productId);
                showToast('❌ ข้อมูลสินค้าไม่ถูกต้อง', 'error');
                return;
            }

            if (!confirm('ยืนยันเปลี่ยนสถานะเป็น "ขายแล้ว"?')) return;

            try {
                await db.collection('marketplace_items').doc(productId).update({
                    status: 'sold',
                    soldAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Update local array
                const product = sellerProducts.find(p => p.id === productId);
                if (product) product.status = 'sold';

                updateSellerDashboardUI();
                filterSellerProducts();
                showToast('✅ ทำเครื่องหมายขายแล้วสำเร็จ!', 'success');
            } catch (error) {
                console.error('Error marking as sold:', error);
                showToast('❌ เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถอัปเดตสถานะได้'), 'error');
            }
        }

        // ขายอีกครั้ง (เปลี่ยน sold กลับเป็น active) - เรียกจาก Dashboard
        async function relistProductDashboard(productId) {
            if (!productId || typeof productId !== 'string') return;

            if (!confirm('ยืนยันเปิดขายสินค้านี้อีกครั้ง?')) return;

            try {
                await db.collection('marketplace_items').doc(productId).update({
                    status: 'active',
                    relistedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                const product = sellerProducts.find(p => p.id === productId);
                if (product) product.status = 'active';

                updateSellerDashboardUI();
                filterSellerProducts();
                showToast('✅ เปิดขายสินค้าอีกครั้งสำเร็จ!', 'success');
            } catch (error) {
                console.error('Error relisting product:', error);
                showToast('❌ เกิดข้อผิดพลาด', 'error');
            }
        }

        // ยืนยันการลบสินค้า - เรียกจาก Dashboard
        function confirmDeleteProductDashboard(productId) {
            if (!productId) return;

            if (typeof showConfirmModal === 'function') {
                showConfirmModal(
                    'ยืนยันการลบสินค้า',
                    'คุณต้องการลบสินค้านี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
                    async () => {
                        await deleteSellerProductDashboard(productId);
                    },
                    'danger'
                );
            } else {
                if (confirm('คุณต้องการลบสินค้านี้หรือไม่?')) {
                    deleteSellerProductDashboard(productId);
                }
            }
        }

        // ลบสินค้า - เรียกจาก Dashboard
        async function deleteSellerProductDashboard(productId) {
            if (!productId || typeof productId !== 'string') return;

            try {
                await db.collection('marketplace_items').doc(productId).delete();

                // Remove from local array
                sellerProducts = sellerProducts.filter(p => p.id !== productId);

                updateSellerDashboardUI();
                filterSellerProducts(); // Refresh list immediately
                showToast('🗑️ ลบสินค้าสำเร็จ!', 'success');
            } catch (error) {
                console.error('Error deleting product:', error);
                showToast('❌ ลบไม่สำเร็จ: ' + error.message, 'error');
            }
        }

        // ดูรายละเอียดสินค้า
        async function viewProduct(productId) {
            if (!productId) return;

            // ปิด dashboard ก่อนถ้าเปิดอยู่
            if (typeof closeSellerDashboard === 'function') closeSellerDashboard();

            // Add view count immediately for better UX
            try {
                db.collection('marketplace_items').doc(productId).update({
                    viewCount: firebase.firestore.FieldValue.increment(1)
                });
            } catch (e) { }

            // Navigate to product page
            window.location.href = `product?id=${productId}`;
        }

        // ตั้งค่าร้าน - เปิด Modal
        function openShopSettings() {
            const modal = document.getElementById('shopSettingsModal');
            modal.classList.add('show');

            // Load current settings
            const shopName = localStorage.getItem('wit_shop_name') || localStorage.getItem('lineDisplayName') || '';
            const lineId = localStorage.getItem('wit_line_id') || '';
            const phone = localStorage.getItem('wit_shop_phone') || '';
            const location = localStorage.getItem('wit_shop_location') || '';
            const description = localStorage.getItem('wit_shop_description') || '';

            document.getElementById('settingShopName').value = shopName;
            document.getElementById('settingLineId').value = lineId;
            document.getElementById('settingPhone').value = phone;
            document.getElementById('settingLocation').value = location;
            document.getElementById('settingDescription').value = description;
        }

        // ปิด Shop Settings Modal
        function closeShopSettings(event) {
            if (event && event.target !== event.currentTarget && !event.target.closest('.close-btn')) return;
            document.getElementById('shopSettingsModal').classList.remove('show');
        }

        // บันทึกการตั้งค่าร้าน
        async function saveShopSettings() {
            const shopName = document.getElementById('settingShopName').value.trim();
            const lineId = document.getElementById('settingLineId').value.trim();
            const phone = document.getElementById('settingPhone').value.trim();
            const location = document.getElementById('settingLocation').value.trim();
            const description = document.getElementById('settingDescription').value.trim();

            if (!shopName) {
                showToast('⚠️ กรุณากรอกชื่อร้านค้า', 'warning');
                return;
            }

            // Save to localStorage
            localStorage.setItem('wit_shop_name', shopName);
            localStorage.setItem('wit_line_id', lineId);
            localStorage.setItem('wit_shop_phone', phone);
            localStorage.setItem('wit_shop_location', location);
            localStorage.setItem('wit_shop_description', description);

            // Also save to Firestore seller profile
            const currentLineUserId = lineUserId || sessionStorage.getItem('lineUserId');
            if (currentLineUserId) {
                try {
                    await db.collection('seller_profiles').doc(currentLineUserId).set({
                        shopName: shopName,
                        lineId: lineId,
                        phone: phone,
                        location: location,
                        description: description,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                } catch (e) {
                    console.error('Error saving seller profile:', e);
                }
            }

            // Update dashboard UI
            document.getElementById('sellerShopName').textContent = shopName;
            if (lineId) {
                document.getElementById('sellerShopId').innerHTML = `<i class="fab fa-line"></i> LINE ID: ${lineId}`;
            }

            closeShopSettings();
            showToast('✅ บันทึกการตั้งค่าสำเร็จ!', 'success');
        }

        // วิเคราะห์ร้าน
        function viewShopAnalytics() {
            const totalProducts = sellerProducts.length;
            const totalViews = sellerProducts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
            const totalSold = sellerProducts.filter(p => p.status === 'sold').length;

            showToast(`📊 สรุป: ${totalProducts} สินค้า | ${totalViews} ยอดดู | ${totalSold} ขายแล้ว`, 'info');
            // TODO: เปิด modal วิเคราะห์แบบละเอียด
        }

        // โปรโมทสินค้า
        function openPromotions() {
            showToast('📢 ฟีเจอร์โปรโมทกำลังพัฒนา...', 'info');
            // TODO: เปิด modal โปรโมท
        }

        // ช่วยเหลือ
        function openSellerHelp() {
            window.open('https://lin.ee/1YJsw47', '_blank');
        }

        // แชร์ร้านของฉัน
        function shareMyShop() {
            const currentLineUserId = lineUserId || sessionStorage.getItem('lineUserId');
            const shopUrl = `${window.location.origin}/marketplace.html?seller=${currentLineUserId}`;
            const text = '🛒 มาดูร้านของฉันใน WiT Marketplace!';

            if (navigator.share) {
                navigator.share({ title: 'ร้านของฉัน', text: text, url: shopUrl });
            } else {
                navigator.clipboard.writeText(shopUrl);
                showToast('📋 คัดลอกลิงก์ร้านแล้ว!', 'success');
            }
        }

        function showSellerTab(tab) {
            currentSellerTab = tab;

            // Update tab UI - ตรวจสอบ text ที่ถูกต้อง
            document.querySelectorAll('.seller-tab').forEach(btn => {
                let isActive = false;
                const text = btn.textContent;
                if (tab === 'active' && text.includes('กำลังขาย')) isActive = true;
                else if (tab === 'sold' && text.includes('ขายแล้ว')) isActive = true;
                else if (tab === 'draft' && text.includes('แบบร่าง')) isActive = true;
                btn.classList.toggle('active', isActive);
            });

            // Re-render filtered by search and tab
            filterSellerProducts();
        }

        function renderSellerProducts(products) {
            const container = document.getElementById('sellerProductsGrid');

            if (products.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:50px; grid-column:1/-1;">
                        <div style="width:80px; height:80px; margin:0 auto 20px; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-box-open" style="font-size:2.5rem; color:rgba(255,255,255,0.4);"></i>
                        </div>
                        <h3 style="color:rgba(255,255,255,0.8); margin-bottom:10px;">${currentSellerTab === 'active' ? 'ยังไม่มีสินค้าที่กำลังขาย' : 'ยังไม่มีสินค้าที่ขายแล้ว'}</h3>
                        <p style="color:rgba(255,255,255,0.5); font-size:0.9rem;">เริ่มลงขายสินค้าของคุณเลย!</p>
                        ${currentSellerTab === 'active' ? `
                            <a href="post-product.html" style="display:inline-flex; align-items:center; gap:8px; margin-top:20px; padding:12px 25px; background:linear-gradient(135deg, #00B900, #06C755); color:white; border-radius:50px; text-decoration:none; font-weight:600;">
                                <i class="fas fa-plus"></i> ลงขายสินค้าใหม่
                            </a>
                        ` : ''}
                    </div>
                `;
                return;
            }

            container.innerHTML = products.map(product => `
                <div class="seller-product-card" onclick="viewProduct('${product.id}')">
                    <div class="seller-product-image">
                        <img src="${product.imageUrl || product.images?.[0] || 'https://placehold.co/200x150?text=No+Image'}" 
                             alt="${product.productName || product.name || 'สินค้า'}"
                             onerror="this.onerror=null; this.src='https://placehold.co/200x150?text=No+Image'">
                        <span class="seller-product-status ${product.status === 'sold' ? 'sold' : 'active'}">
                            ${product.status === 'sold' ? '✓ ขายแล้ว' : '● กำลังขาย'}
                        </span>
                    </div>
                    <div class="seller-product-info">
                        <h4 class="seller-product-name">${product.productName || product.name || 'ไม่มีชื่อ'}</h4>
                        <div class="seller-product-price">฿${formatPrice(product.price)}</div>
                        <div class="seller-product-stats">
                            <span><i class="fas fa-eye"></i> ${product.viewCount || product.views || 0}</span>
                            <span><i class="fas fa-heart"></i> ${product.likes || 0}</span>
                        </div>
                    </div>
                    <div class="seller-product-actions">
                        ${product.status !== 'sold' ? `
                            <button class="edit-btn" onclick="event.stopPropagation(); markAsSoldDashboard('${product.id}')">
                                <i class="fas fa-check"></i> ขายแล้ว
                            </button>
                        ` : `
                            <button class="edit-btn" onclick="event.stopPropagation(); relistProductDashboard('${product.id}')">
                                <i class="fas fa-redo"></i> ขายอีกครั้ง
                            </button>
                        `}
                        <button class="delete-btn" onclick="event.stopPropagation(); confirmDeleteProductDashboard('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // ตรวจสอบและแสดงปุ่ม "ร้านของฉัน" - ลบแล้วเพราะย้ายไป dropdown
        function checkShowMyShopButton() {
            // ฟังก์ชันนี้ไม่จำเป็นแล้วเพราะย้ายไป user dropdown
            // แต่เก็บไว้เพื่อไม่ให้ error
            console.log('checkShowMyShopButton: Deprecated, moved to user dropdown');
        }

        // ========================================
        // HELPER FUNCTIONS
        // ========================================

        // Format price with commas
        function formatPrice(price) {
            return new Intl.NumberFormat('th-TH').format(price || 0);
        }

        // Mask phone number
        function maskPhoneNumber(phone) {
            if (!phone || phone.length < 10) return phone;
            return phone.substring(0, 3) + ' - XXX - ' + phone.substring(phone.length - 4);
        }

        // Render Skeletons for Loading State
        function renderSkeletons(count) {
            return Array(count).fill(0).map(() => `
                <div class="product-card skeleton-card" style="background:#fff; border-radius:15px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <div class="skeleton-image" style="width:100%; pt-3; height:200px; background:linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite;"></div>
                    <div style="padding:15px;">
                        <div class="skeleton-text" style="height:20px; width:80%; background:#e0e0e0; border-radius:4px; margin-bottom:10px; animation:pulse 1.5s infinite;"></div>
                        <div class="skeleton-text" style="height:20px; width:40%; background:#e0e0e0; border-radius:4px; margin-bottom:10px; animation:pulse 1.5s infinite;"></div>
                    </div>
                </div>
            `).join('');
        }

        // Render Empty State
        function renderEmptyState(message, showRetry = false, retryFn = '') {
            return `
                <div class="empty-state" style="text-align:center; padding:50px 20px; grid-column:1/-1; width:100%;">
                    <div class="empty-state-icon" style="font-size:4rem; color:#cbd5e1; margin-bottom:20px;">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h3 style="color:#64748b; font-size:1.2rem; font-weight:600; margin-bottom:10px;">${message}</h3>
                    <p style="color:#94a3b8; font-size:0.9rem;">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดใหม่อีกครั้ง</p>
                    ${showRetry ? `
                        <button class="btn btn-primary mt-3 px-4 py-2 rounded-pill" onclick="${retryFn}">
                            <i class="fas fa-redo me-2"></i> ลองใหม่อีกครั้ง
                        </button>
                    ` : ''}
                </div>
            `;
        }

        // Load products from Firestore with Pagination
        async function loadProducts(isLoadMore = false) {
            if (isSecondhandLoading) return;

            try {
                isSecondhandLoading = true;
                const container = document.getElementById('productContainer');
                const loading = document.getElementById('loading');
                const loadMoreBtn = document.getElementById('btnLoadMoreSecondhand');
                const loadMoreContainer = document.getElementById('loadMoreSecondhandContainer');
                const loadMoreSpinner = document.getElementById('loadMoreSecondhandSpinner');

                if (!isLoadMore) {
                    if (loading) loading.style.display = 'flex';
                    if (container) container.innerHTML = renderSkeletons(8); // Show skeletons while loading
                    allProducts = [];
                    lastProductDoc = null;
                } else {
                    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                    if (loadMoreSpinner) loadMoreSpinner.style.display = 'block';
                }

                // Main Query: Active Status + Sorted by Date
                let query = db.collection('marketplace_items')
                    .where('status', '==', 'active')
                    .orderBy('createdAt', 'desc');

                if (lastProductDoc) {
                    query = query.startAfter(lastProductDoc);
                }

                const snapshot = await query.limit(PAGE_LIMIT).get();

                console.log(`📦 Loaded ${snapshot.size} products (LoadMore: ${isLoadMore})`);

                if (snapshot.empty) {
                    if (!isLoadMore) {
                        // Diagnostic: Check if ANY products exist at all (ignoring status)
                        const checkAny = await db.collection('marketplace_items').limit(1).get();
                        if (checkAny.empty) {
                            if (container) container.innerHTML = renderEmptyState('ยังไม่มีสินค้าในระบบ', false);
                        } else {
                            // Data exists but not matching filter
                            if (container) container.innerHTML = renderEmptyState('ไม่พบสินค้าที่พร้อมขาย (Status: active)', true, 'loadProducts()');
                        }
                    }
                    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
                } else {
                    lastProductDoc = snapshot.docs[snapshot.docs.length - 1];
                    const newProducts = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        // Ensure ID is set
                        newProducts.push({ id: doc.id, ...data });
                    });

                    allProducts = isLoadMore ? [...allProducts, ...newProducts] : newProducts;
                    console.log('✅ Updated allProducts:', allProducts.length);

                    // Show/Hide load more button
                    if (loadMoreContainer) loadMoreContainer.style.display = snapshot.docs.length < PAGE_LIMIT ? 'none' : 'block';

                    filterProducts();
                    updateStats();
                    updateHeroProducts();
                    updateCategoryCounts();
                }

            } catch (error) {
                console.error('Error loading products:', error);

                let errMsg = 'เกิดข้อผิดพลาดในการโหลดสินค้า';

                // Check for generic connection errors
                if (error.code === 'unavailable' || error.message.includes('backend') || error.message.includes('offline')) {
                    errMsg = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ต';
                }
                // Check specifically for Missing Index error
                else if (error.code === 'failed-precondition' || error.toString().includes('index')) {
                    errMsg = '⚠️ ระบบต้องการการตั้งค่า Index เพิ่มเติม (กรุณาแจ้งผู้ดูแลระบบ)';
                    console.warn('⚡ Missing Index Link:', error.message);
                }

                if (!isLoadMore) {
                    const container = document.getElementById('productContainer');
                    if (container) {
                        // Display error permanently in container
                        container.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon" style="background: #fee2e2; color: #ef4444;">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <h3 style="color:#ef4444">เกิดข้อผิดพลาด</h3>
                                <p>${errMsg}</p>
                                <button class="btn btn-primary mt-3 px-4 py-2 rounded-pill" onclick="loadProducts()">
                                    <i class="fas fa-redo me-2"></i> ลองใหม่อีกครั้ง
                                </button>
                            </div>
                        `;
                    }
                } else {
                    showToast('❌ ' + errMsg, 'error');
                }
            } finally {
                isSecondhandLoading = false;
                const loadingEl = document.getElementById('loading');
                if (loadingEl) loadingEl.style.display = 'none';

                const loadMoreSpinner = document.getElementById('loadMoreSecondhandSpinner');
                if (loadMoreSpinner) loadMoreSpinner.style.display = 'none';

                const loadMoreContainer = document.getElementById('loadMoreSecondhandContainer');
                const btnLoadMore = document.getElementById('btnLoadMoreSecondhand');

                if (loadMoreContainer && loadMoreContainer.style.display !== 'none' && btnLoadMore) {
                    btnLoadMore.style.display = 'inline-flex';
                }
            }
        }

        // Bridge function for load more button
        function loadMoreProducts() {
            loadProducts(true);
        }

        // Update stats
        function updateStats() {
            const total = allProducts.length;
            const today = allProducts.filter(p => isNewProduct(p.createdAt)).length;

            if (window.witAnimateStatsNumber) {
                window.witAnimateStatsNumber('totalProducts', total);
                window.witAnimateStatsNumber('todayProducts', today);
            } else {
                const totalEl = document.getElementById('totalProducts');
                const todayEl = document.getElementById('todayProducts');
                if (totalEl) totalEl.textContent = total;
                if (todayEl) todayEl.textContent = today;
            }
        }

        // Helper: Check if product is new (within 3 days)
        function isNewProduct(createdAt) {
            if (!createdAt) return false;
            try {
                const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
                const now = new Date();
                const diffTime = Math.abs(now - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 3;
            } catch (e) { return false; }
        }

        // Filter Products
        function filterProducts() {
            let filtered = [...allProducts];

            // 1. Filter by Category
            if (currentCategory && currentCategory !== 'all') {
                filtered = filtered.filter(p => p.category === currentCategory);
            }

            // 2. Filter by Search Query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(p =>
                    (p.productName && p.productName.toLowerCase().includes(query)) ||
                    (p.description && p.description.toLowerCase().includes(query)) ||
                    (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
                );
            }

            // 3. Filter by Seller (if selected)
            if (currentSellerId) {
                filtered = filtered.filter(p => p.sellerId === currentSellerId || p.lineUserId === currentSellerId);
            }

            // Render
            const container = document.getElementById('productContainer');
            if (container) {
                if (filtered.length === 0) {
                    container.innerHTML = renderEmptyState('ไม่พบสินค้าที่คุณค้นหา', false);
                } else {
                    container.innerHTML = filtered.map(p => renderProductCard(p)).join('');
                    updateSavedButtonsUI();
                }
            }
        }

        function timeAgo(dateInput) {
            if (!dateInput) return '';

            let date;
            // Check if it's a Firestore Timestamp (has toDate method)
            if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                date = dateInput.toDate();
            } else {
                date = new Date(dateInput);
            }

            // Check if date is valid
            if (isNaN(date.getTime())) return '';

            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (days < 0) return 'เมื่อสักครู่'; // Handle slight future dates (clock skew)
            if (days === 0) return 'วันนี้';
            if (days === 1) return 'เมื่อวาน';
            if (days < 30) return `${days} วันที่แล้ว`;
            if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
            return `${Math.floor(days / 365)} ปีที่แล้ว`;
        }

        // Render Product Card
        function renderProductCard(product) {
            const isNew = isNewProduct(product.createdAt);
            let statusBadge = '';

            if (product.status === 'sold') {
                statusBadge = '<span class="product-badge badge-hot" style="background: #dc3545;">ขายแล้ว</span>';
            } else if (isNew) {
                statusBadge = '<span class="product-badge badge-new">มาใหม่</span>';
            }

            return `
                <div class="product-card" onclick="viewProduct('${product.id}')">
                    <div class="product-image">
                        ${statusBadge}
                        <img src="${product.imageUrl || 'https://placehold.co/300x300?text=No+Image'}" 
                             alt="${product.productName}"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=No+Image'">
                        <div class="product-location-badge">
                            <i class="fas fa-map-marker-alt"></i> ${product.sellerLocation || 'ไม่ระบุ'}
                        </div>
                        <div class="product-actions">
                            <button class="action-btn save-btn-circle" id="saveProduct-${product.id}" onclick="event.stopPropagation(); toggleSaveMarketItem('${product.id}', 'product')" title="บันทึก">
                                <i class="far fa-bookmark"></i>
                            </button>
                            <button class="action-btn" onclick="event.stopPropagation(); addToCart('${product.id}')" title="เพิ่มลงตะกร้า">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                            <button class="action-btn" onclick="event.stopPropagation(); shareProductCard('${product.id}')" title="แชร์">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.productName}</div>
                        
                        <div class="product-price">
                            <span class="price-currency">฿</span>${formatPrice(product.price)}
                        </div>
                        
                        <div class="product-meta">
                            <div class="product-seller">
                                <img src="${product.sellerPictureUrl || 'https://placehold.co/30?text=?'}" 
                                     class="seller-avatar-mini"
                                     alt="${product.sellerName}"
                                     onerror="this.onerror=null; this.src='https://placehold.co/30?text=?'">
                                <span class="seller-name-text">${product.sellerName || 'ผู้ขาย'}</span>
                            </div>
                            <div class="product-stats">
                                <div class="view-item">
                                    <i class="fas fa-eye"></i> <span>${product.viewCount || 0}</span>
                                </div>
                                <div class="time-item" style="font-size: 0.65rem; opacity: 0.7;">
                                    ${timeAgo(product.createdAt)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Navigation: View Product


        // Action: Add to Cart (Simple localStorage implementation)
        function addToCart(id) {
            try {
                let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                if (!cart.includes(id)) {
                    cart.push(id);
                    localStorage.setItem('cart', JSON.stringify(cart));
                    showToast('เพิ่มสินค้าในตะกร้าแล้ว', 'success');

                    // Animate cart badge if exists
                    const badge = document.querySelector('.cart-badge');
                    if (badge) {
                        badge.textContent = cart.length;
                        badge.classList.add('pulse');
                        setTimeout(() => badge.classList.remove('pulse'), 1000);
                    }
                } else {
                    showToast('สินค้านี้มีในตะกร้าแล้ว', 'info');
                }
            } catch (e) {
                console.error(e);
            }
        }

        // ========================================
        // 🔖 Permanent Bookmarking (Firestore)
        // ========================================
        let userSavedItems = [];

        async function loadUserSavedItems() {
            const user = firebase.auth().currentUser || WizmobizAuth.getUser();
            if (!user) return;
            const uid = user.uid || user.lineUserId;
            try {
                const doc = await db.collection('users').doc(uid).get();
                if (doc.exists) {
                    userSavedItems = doc.data().savedItems || [];
                    updateSavedButtonsUI();
                }
            } catch (e) { console.error('Error loading saved items:', e); }
        }

        function updateSavedButtonsUI() {
            if (!userSavedItems.length) return;
            userSavedItems.forEach(item => {
                const btn1 = document.getElementById(`saveProduct-${item.id}`);
                const btn2 = document.getElementById(`saveCommProduct-${item.id}`);
                const btn3 = document.getElementById(`saveModalProduct-${item.id}`);

                [btn1, btn2, btn3].forEach(btn => {
                    if (btn) {
                        btn.classList.add('active');
                        const icon = btn.querySelector('i');
                        if (icon) icon.classList.replace('far', 'fas');
                    }
                });
            });
        }

        window.toggleSaveMarketItem = async function (itemId, type) {
            const user = firebase.auth().currentUser || WizmobizAuth.getUser();
            if (!user) {
                showToast('กรุณาเข้าสู่ระบบก่อนครับ', 'warning');
                if (typeof WizmobizAuth.showLoginModal === 'function') WizmobizAuth.showLoginModal();
                return;
            }

            const uid = user.uid || user.lineUserId;
            const userRef = db.collection('users').doc(uid);

            // Check current status in our local array
            const isSaved = userSavedItems.some(i => i.id === itemId);
            const btnId = type === 'product' ? `saveProduct-${itemId}` : `saveCommProduct-${itemId}`;
            const btn = document.getElementById(btnId) || document.getElementById(`saveModalProduct-${itemId}`);

            try {
                if (!isSaved) {
                    await userRef.set({
                        savedItems: firebase.firestore.FieldValue.arrayUnion({
                            id: itemId,
                            type: type,
                            savedAt: new Date().toISOString()
                        })
                    }, { merge: true });

                    userSavedItems.push({ id: itemId, type: type });
                    if (btn) {
                        btn.classList.add('active');
                        const icon = btn.querySelector('i');
                        if (icon) icon.classList.replace('far', 'fas');
                    }
                    showToast('บันทึกเรียบร้อยแล้ว', 'success');
                } else {
                    const doc = await userRef.get();
                    if (doc.exists) {
                        const saved = doc.data().savedItems || [];
                        const filtered = saved.filter(i => i.id !== itemId);
                        await userRef.update({ savedItems: filtered });
                    }

                    userSavedItems = userSavedItems.filter(i => i.id !== itemId);
                    if (btn) {
                        btn.classList.remove('active');
                        const icon = btn.querySelector('i');
                        if (icon) icon.classList.replace('fas', 'far');
                    }
                    showToast('นำออกจากรายการบันทึกแล้ว', 'info');
                }
            } catch (e) {
                console.error('Save error:', e);
                showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
            }
        };

        window.toggleSaveModalItem = function () {
            if (typeof currentCommProduct !== 'undefined' && currentCommProduct && document.getElementById('commProductModal').classList.contains('show')) {
                toggleSaveMarketItem(currentCommProduct.id, 'community_product');
            } else if (typeof currentViewProduct !== 'undefined' && currentViewProduct && document.getElementById('quickViewModal').classList.contains('show')) {
                toggleSaveMarketItem(currentViewProduct.id, 'product');
            }
        };

        // Action: Share Product
        function shareProductCard(id) {
            const url = `${window.location.origin}/product?id=${id}`;
            if (navigator.share) {
                navigator.share({
                    title: 'TukTuk Marketplace',
                    text: 'ช้อปสินค้านี้บน TukTuk',
                    url: url
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(url).then(() => {
                    showToast('คัดลอกลิงก์เรียบร้อย', 'success');
                }).catch(() => {
                    prompt('Copy link:', url);
                });
            }
        }

        // UI: Toast Notification
        function showToast(message, type = 'info') {
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
            const toast = document.createElement('div');
            toast.className = `toast-message ${type}`;
            toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Update Category Counts (Placeholder for now as IDs need to be verified)
        function updateCategoryCounts() {
            // Implementation can be added if category badges have IDs
        }

        // Update Hero Products (Trending Spotlight)
        function updateHeroProducts() {
            if (!allProducts || allProducts.length === 0) return;

            // 1. หาช่วงสินค้าที่เป็น "Top Trending" (เช่น 15 อันดับแรกที่มีคนดูเยอะที่สุด)
            const trendingPool = [...allProducts]
                .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                .slice(0, 15);

            // 2. สุ่มเลือก 4 รายการจาก Pool นี้มาแสดงผล
            const shuffled = trendingPool.sort(() => 0.5 - Math.random());
            const selectedProducts = shuffled.slice(0, 4);

            // 3. Render ลงใน List
            const container = document.getElementById('heroSpotlightProducts');
            if (container) {
                if (selectedProducts.length > 0) {
                    container.innerHTML = selectedProducts.map(p => renderHeroProductItem(p)).join('');
                } else {
                    container.innerHTML = '<p style="color:rgba(255,255,255,0.6); font-size:0.85rem; text-align:center;">ยังไม่มีสินค้าแนะนำ</p>';
                }
            }
        }

        // Render Hero Product Item
        function renderHeroProductItem(product) {
            return `
                <div class="hero-product-item" onclick="viewProduct('${product.id}')">
                    <img class="hero-product-img" 
                         src="${product.imageUrl || 'https://placehold.co/80'}" 
                         alt="${product.productName}"
                         onerror="this.onerror=null; this.src='https://placehold.co/80'">
                    <div class="hero-product-info">
                        <div class="hero-product-name">${product.productName}</div>
                        <div class="hero-product-price">฿${formatPrice(product.price)}</div>
                    </div>
                    <div class="hero-trend-stats" style="text-align: right; min-width: 60px;">
                        <div style="font-size: 0.7rem; color: #FFEB3B; font-weight: 700;">
                            <i class="fas fa-eye"></i> ${product.viewCount || 0}
                        </div>
                        <div style="font-size: 0.6rem; color: rgba(255,255,255,0.5);">Watching</div>
                    </div>
                </div>
            `;
        }



        // Search products
        function searchProducts() {
            searchQuery = document.getElementById('searchInput').value.trim();

            if (currentMarketType === 'secondhand') {
                // Reset seller filter when searching in secondhand
                currentSellerId = null;

                // Update title
                const titleText = document.getElementById('sectionTitleText');
                if (titleText) {
                    titleText.textContent = searchQuery
                        ? `ผลการค้นหา "${searchQuery}"`
                        : 'สินค้าล่าสุด';
                }

                // Clean URL
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.pushState({ path: cleanUrl }, '', cleanUrl);

                filterProducts();
            } else {
                // Search in community market
                filterCommunity(currentCommunityCategory);
            }
        }

        // Add handleSearch as an alias for executeSmartSearch compatibility
        function handleSearch() {
            searchProducts();
        }

        // Category click handler
        document.getElementById('categoryTabs').addEventListener('click', (e) => {
            const tab = e.target.closest('.category-tab');
            if (!tab) return;

            // Update active state
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Reset seller filter when category changes
            currentSellerId = null;

            // Update category
            currentCategory = tab.dataset.category;

            // Update title
            const titles = {
                'all': 'สินค้าทั้งหมด',
                'mobile': '📱 มือถือ/สมาร์ทโฟน',
                'electronics': '💻 อิเล็กทรอนิกส์',
                'computer': '🖥️ คอมพิวเตอร์',
                'gaming': '🎮 เกมมิ่ง',
                'fashion': '👕 แฟชั่น',
                'home': '🏠 ของใช้ในบ้าน',
                'beauty': '💄 ความงาม',
                'sports': '⚽ กีฬา',
                'other': '📦 อื่นๆ'
            };
            document.getElementById('sectionTitleText').textContent = titles[currentCategory] || 'สินค้าล่าสุด';

            // Clean URL when returning to categories
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.pushState({ path: cleanUrl }, '', cleanUrl);

            filterProducts();
        });

        // Search on Enter key
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });

        // Scroll to top
        const scrollTopBtn = document.getElementById('scrollTop');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadProducts();
            initAIGenerator();
            checkShowMyShopButton();
        });

        // ========================================
        // AI POST GENERATOR
        // ========================================

        let selectedImage = null;
        let currentAIPost = null;

        // Initialize AI Generator
        function initAIGenerator() {
            const btn = document.getElementById('aiGeneratorBtn');
            const modal = document.getElementById('aiModal');
            const uploadArea = document.getElementById('aiUploadArea');

            if (!btn || !modal || !uploadArea) return;

            // Open modal - เช็คโควต้าฟรีก่อน (ไม่ต้อง login)
            btn.addEventListener('click', async () => {
                // 🎁 เช็คโควต้าฟรี (3 ครั้ง) ก่อนเปิด modal
                const canUse = await checkAIQuota();
                if (!canUse) {
                    return; // Modal จะแสดงอัตโนมัติ
                }

                modal.classList.add('show');
            });

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeAIModal();
                }
            });

            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    processImage(file);
                }
            });
        }

        // Close modal
        function closeAIModal() {
            document.getElementById('aiModal').classList.remove('show');
        }

        // Handle image select
        function handleImageSelect(event) {
            const file = event.target.files[0];
            if (file) {
                processImage(file);
            }
        }

        // Process image
        function processImage(file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('❌ ไฟล์ใหญ่เกินไป (ไม่เกิน 5MB)', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImage = e.target.result;
                document.getElementById('aiPreviewImage').src = selectedImage;
                document.getElementById('aiUploadArea').style.display = 'none';
                document.getElementById('aiPreviewContainer').style.display = 'block';
                document.getElementById('aiGenerateBtn').disabled = false;
            };
            reader.readAsDataURL(file);
        }

        // Reset upload
        function resetAIUpload() {
            selectedImage = null;
            document.getElementById('aiFileInput').value = '';
            document.getElementById('aiUploadArea').style.display = 'block';
            document.getElementById('aiPreviewContainer').style.display = 'none';
            document.getElementById('aiGenerateBtn').disabled = true;
        }

        // Generate AI Post
        async function generateAIPost() {
            if (!selectedImage) {
                showToast('❌ กรุณาเลือกรูปสินค้าก่อน', 'error');
                return;
            }

            // 🎁 เช็คโควต้าฟรี (3 ครั้ง) อีกครั้งก่อนสร้าง
            const canUse = await checkAIQuota();
            if (!canUse) {
                return; // Modal จะแสดงอัตโนมัติ
            }

            const extraInfo = document.getElementById('aiExtraInfo').value;

            // Show loading
            document.getElementById('aiUploadSection').style.display = 'none';
            document.getElementById('aiLoading').style.display = 'block';
            document.getElementById('aiResult').style.display = 'none';

            try {
                // Call Gemini API via Firebase Function
                const result = await callGeminiVision(selectedImage, extraInfo);

                // result is already the parsed data from API
                currentAIPost = result;
                displayAIResult(result);

                // 📊 เพิ่ม usage count
                await incrementAIUsage();

                showToast('✅ สร้างข้อความสำเร็จ!', 'success');
            } catch (error) {
                console.error('AI Error:', error);
                showToast('❌ เกิดข้อผิดพลาด: ' + error.message, 'error');
                resetAIGenerator();
            }
        }

        // 📊 Increment AI Usage Count
        async function incrementAIUsage() {
            try {
                // ✅ Re-check session
                let userId = lineUserId;
                if (!userId) {
                    const session = await checkSavedSession();
                    if (session && session.lineUserId) {
                        userId = session.lineUserId;
                        lineUserId = userId;
                    }
                }

                if (userId) {
                    // Login แล้ว → บันทึกใน Firestore
                    await db.collection('ai_post_usage').doc(userId).set({
                        count: firebase.firestore.FieldValue.increment(1),
                        lastUsed: new Date().toISOString()
                    }, { merge: true });
                } else {
                    // ไม่ได้ login → บันทึกใน localStorage
                    const currentCount = parseInt(localStorage.getItem('ai_free_usage') || '0');
                    localStorage.setItem('ai_free_usage', (currentCount + 1).toString());
                }
            } catch (error) {
                console.error('Error incrementing usage:', error);
            }
        }

        // Call Firebase Function for AI Vision
        async function callGeminiVision(imageData, extraInfo) {
            // Use Firebase Function instead of direct API key (more secure)
            const API_URL = 'https://us-central1-appinjproject.cloudfunctions.net/marketplaceAIGeneratePost';

            // Remove data URL prefix
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

            // ✅ Use current lineUserId
            const userId = lineUserId || null;

            const requestBody = {
                imageBase64: base64Data,
                additionalInfo: extraInfo || '',
                lineUserId: userId  // ส่ง LINE User ID ถ้ามี
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'API request failed');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'AI processing failed');
            }

            return data.data;  // Return parsed AI result directly
        }

        // Display AI Result
        function displayAIResult(data) {
            document.getElementById('aiLoading').style.display = 'none';
            document.getElementById('aiResult').style.display = 'block';

            document.getElementById('aiProductName').textContent = data.productName || '-';
            document.getElementById('aiSuggestedPrice').textContent = data.suggestedPrice || '-';
            document.getElementById('aiCategory').textContent = data.category || '-';
            document.getElementById('aiEmojis').textContent = data.emojis || '✨';

            document.getElementById('aiPostTitle').textContent = data.title || '';
            document.getElementById('aiPostDescription').textContent = data.description || '';
            document.getElementById('aiPostCta').textContent = data.callToAction || '';

            const hashtags = data.hashtags ? data.hashtags.map(h => `#${h}`).join(' ') : '';
            document.getElementById('aiPostHashtags').textContent = hashtags;

            // Update usage badge
            updateUsageBadge();
        }

        // เครดิต
        const AI_POST_CREDIT = '\n\n#wit365 tuktukfeed.com';

        // Copy AI Post
        function copyAIPost() {
            if (!currentAIPost) return;

            const hashtags = currentAIPost.hashtags ? currentAIPost.hashtags.map(h => `#${h}`).join(' ') : '';
            const fullPost = `${currentAIPost.title}\n\n${currentAIPost.description}\n\n${currentAIPost.callToAction}\n\n${hashtags}${AI_POST_CREDIT}`;

            navigator.clipboard.writeText(fullPost).then(() => {
                const btn = document.querySelector('.ai-copy-btn');
                btn.innerHTML = '<i class="fas fa-check"></i> คัดลอกแล้ว!';
                btn.classList.add('copied');
                showToast('📋 คัดลอกข้อความเรียบร้อย!', 'success');

                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-copy"></i> คัดลอก';
                    btn.classList.remove('copied');
                }, 2000);
            });
        }

        // Share to LINE
        function shareToLine() {
            if (!currentAIPost) return;

            const hashtags = currentAIPost.hashtags ? currentAIPost.hashtags.map(h => `#${h}`).join(' ') : '';
            const text = `${currentAIPost.title}\n\n${currentAIPost.description}\n\n${currentAIPost.callToAction}\n\n${hashtags}${AI_POST_CREDIT}`;
            const encoded = encodeURIComponent(text);

            window.open(`https://line.me/R/share?text=${encoded}`, '_blank');
        }

        // ========================================
        // POST TO MARKETPLACE & FACEBOOK
        // ========================================

        // Post to Marketplace - ลงขายสินค้าพร้อมข้อมูลอัตโนมัติ
        async function postToMarketplace() {
            if (!currentAIPost) {
                showToast('❌ ไม่มีข้อมูลสินค้า', 'error');
                return;
            }

            // ✅ Re-check session directly (don't rely on global variable)
            let userId = lineUserId;
            if (!userId) {
                const session = await checkSavedSession();
                if (session && session.lineUserId) {
                    userId = session.lineUserId;
                    lineUserId = userId; // Update global
                    sessionStorage.setItem('lineUserId', userId);
                    console.log('🔄 Re-checked session, found:', session.displayName);
                }
            }

            // ตรวจสอบสิทธิ์การใช้งาน
            if (!userId) {
                // ยังไม่ได้เป็นสมาชิก LINE OA - แจ้งให้เพิ่มเพื่อน
                console.log('❌ No userId found, showing membership modal');
                showMembershipModal();
                return;
            }

            console.log('✅ Posting with userId:', userId);

            // ดึงชื่อผู้ใช้ LINE
            let displayName = '';
            const wizmobizSession = localStorage.getItem('wizmobiz_session');
            const witSession = localStorage.getItem('wit_line_session');
            if (wizmobizSession) {
                try {
                    const session = JSON.parse(wizmobizSession);
                    displayName = session.displayName || '';
                } catch (e) { }
            } else if (witSession) {
                try {
                    const session = JSON.parse(witSession);
                    displayName = session.displayName || '';
                } catch (e) { }
            }

            // สร้าง URL พร้อมข้อมูลสินค้าที่ AI สร้าง
            const productData = {
                productName: currentAIPost.productName || currentAIPost.title,
                price: extractPrice(currentAIPost.suggestedPrice),
                description: `${currentAIPost.title}\n\n${currentAIPost.description}\n\n${currentAIPost.callToAction}`,
                category: mapCategory(currentAIPost.category),
                hashtags: currentAIPost.hashtags || [],
                fromAI: true,
                lineUserId: userId,
                displayName: displayName  // ชื่อ LINE ผู้โพสต์
            };

            // ✅ เก็บรูปภาพใน sessionStorage (เพราะ URL ยาวเกินไป)
            if (selectedImage) {
                sessionStorage.setItem('ai_product_image', selectedImage);
            }

            // ✅ เก็บข้อมูลทั้งหมดใน sessionStorage (ปลอดภัยกว่า URL)
            sessionStorage.setItem('ai_product_data', JSON.stringify(productData));

            // Redirect ไปหน้า post-product
            window.location.href = `post-product.html?fromAI=true&lineUserId=${userId}`;
        }

        // Share to Facebook
        function shareToFacebookPost() {
            if (!currentAIPost) return;

            const hashtags = currentAIPost.hashtags ? currentAIPost.hashtags.map(h => `#${h}`).join(' ') : '';
            const text = `${currentAIPost.title}\n\n${currentAIPost.description}\n\n${currentAIPost.callToAction}\n\n${hashtags}${AI_POST_CREDIT}`;

            // Facebook share dialog
            const fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
            window.open(fbUrl, '_blank', 'width=600,height=400');
        }

        // Extract price number from suggested price string
        function extractPrice(priceStr) {
            if (!priceStr) return 0;
            // ดึงตัวเลขแรกที่พบ
            const match = priceStr.match(/[\d,]+/);
            if (match) {
                return parseInt(match[0].replace(/,/g, '')) || 0;
            }
            return 0;
        }

        // Map AI category to marketplace category
        function mapCategory(aiCategory) {
            if (!aiCategory) return 'other';
            const cat = aiCategory.toLowerCase();
            // มือถือ/โทรศัพท์
            if (cat.includes('มือถือ') || cat.includes('โทรศัพท์') || cat.includes('phone') || cat.includes('mobile') || cat.includes('iphone') || cat.includes('samsung') || cat.includes('oppo')) return 'mobile';
            // อิเล็กทรอนิกส์
            if (cat.includes('อิเล็ก') || cat.includes('electronic') || cat.includes('คอมพิวเตอร์') || cat.includes('computer')) return 'electronics';
            if (cat.includes('แฟชั่น') || cat.includes('เสื้อผ้า') || cat.includes('fashion') || cat.includes('รองเท้า') || cat.includes('กระเป๋า')) return 'fashion';
            if (cat.includes('บ้าน') || cat.includes('home') || cat.includes('เฟอร์นิเจอร์')) return 'home';
            if (cat.includes('ความงาม') || cat.includes('beauty') || cat.includes('เครื่องสำอาง')) return 'beauty';
            if (cat.includes('กีฬา') || cat.includes('sport') || cat.includes('ออกกำลัง')) return 'sports';
            if (cat.includes('ยานยนต์') || cat.includes('รถ') || cat.includes('มอเตอร์ไซค์')) return 'vehicle';
            if (cat.includes('เกม') || cat.includes('game') || cat.includes('gaming')) return 'gaming';
            return 'other';
        }

        // Show membership modal with PIN system
        function showMembershipModal() {
            const modal = document.createElement('div');
            modal.className = 'membership-modal-overlay';
            modal.innerHTML = `
                <div class="membership-modal">
                    <div class="membership-header">
                        <h3><i class="fas fa-lock"></i> 🔐 เข้าสู่ระบบด้วย PIN</h3>
                        <button class="close-btn" onclick="this.closest('.membership-modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="membership-body">
                        <p>เพื่อใช้งานฟีเจอร์ <strong>ลงขายสินค้า</strong></p>
                        <p>กรอกรหัส 6 หลักจาก LINE OA</p>
                        
                        <!-- PIN Input -->
                        <div class="pin-container" style="margin: 20px 0;">
                            <div class="pin-inputs" style="display: flex; justify-content: center; gap: 6px;">
                                <input type="text" maxlength="1" class="pin-digit" style="width: 40px; height: 50px; font-size: 20px; text-align: center; border: 2px solid #ddd; border-radius: 10px; font-weight: bold; text-transform: uppercase;" />
                                <input type="text" maxlength="1" class="pin-digit" style="width: 40px; height: 50px; font-size: 20px; text-align: center; border: 2px solid #ddd; border-radius: 10px; font-weight: bold; text-transform: uppercase;" />
                                <input type="text" maxlength="1" class="pin-digit" style="width: 40px; height: 50px; font-size: 20px; text-align: center; border: 2px solid #ddd; border-radius: 10px; font-weight: bold; text-transform: uppercase;" />
                                <input type="text" maxlength="1" class="pin-digit" style="width: 40px; height: 50px; font-size: 20px; text-align: center; border: 2px solid #ddd; border-radius: 10px; font-weight: bold; text-transform: uppercase;" />
                                <input type="text" maxlength="1" class="pin-digit" style="width: 40px; height: 50px; font-size: 20px; text-align: center; border: 2px solid #ddd; border-radius: 10px; font-weight: bold; text-transform: uppercase;" />
                                <input type="text" maxlength="1" class="pin-digit" style="width: 40px; height: 50px; font-size: 20px; text-align: center; border: 2px solid #ddd; border-radius: 10px; font-weight: bold; text-transform: uppercase;" />
                            </div>
                            <div id="modalPinError" style="color: #f44336; font-size: 0.85rem; margin-top: 10px; display: none;"></div>
                            <div id="modalPinLoading" style="color: #667eea; font-size: 0.85rem; margin-top: 10px; display: none;">🔄 กำลังตรวจสอบ...</div>
                        </div>
                        
                        <button onclick="verifyModalPIN()" class="line-add-btn" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <i class="fas fa-unlock"></i> ยืนยันรหัส
                        </button>
                        
                        <div class="membership-benefits" style="margin-top: 20px;">
                            <div class="benefit-item">
                                <i class="fas fa-gift"></i>
                                <span>สมาชิกฟรี ใช้ได้ 3 ครั้ง</span>
                            </div>
                            <div class="benefit-item premium">
                                <i class="fas fa-crown"></i>
                                <span>Premium ใช้ได้ไม่จำกัด</span>
                            </div>
                        </div>
                        
                        <p class="hint-text" style="margin-top: 15px;">ยังไม่มีรหัส? <a href="https://lin.ee/1YJsw47" target="_blank">เพิ่มเพื่อน LINE OA</a> แล้วพิมพ์ <strong>"ขอรหัสผ่าน"</strong></p>
                        <p class="hint-text" style="font-size: 0.75rem; color: #999;">🔒 1 รหัสใช้ได้ 1 อุปกรณ์เท่านั้น</p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Setup PIN inputs
            setupModalPINInputs();

            // Click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        // Setup PIN inputs in modal
        function setupModalPINInputs() {
            setTimeout(() => {
                const pinInputs = document.querySelectorAll('.membership-modal .pin-digit');
                pinInputs.forEach((input, index) => {
                    input.addEventListener('input', (e) => {
                        const value = e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                        e.target.value = value;
                        if (value && index < pinInputs.length - 1) {
                            pinInputs[index + 1].focus();
                        }
                        // Auto verify when all filled
                        const allFilled = Array.from(pinInputs).every(inp => inp.value);
                        if (allFilled) setTimeout(() => verifyModalPIN(), 100);
                    });

                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Backspace' && !e.target.value && index > 0) {
                            pinInputs[index - 1].focus();
                        }
                    });

                    input.addEventListener('paste', (e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 6);
                        pastedData.split('').forEach((char, i) => {
                            if (pinInputs[i]) pinInputs[i].value = char;
                        });
                        if (pastedData.length === 6) setTimeout(() => verifyModalPIN(), 100);
                    });
                });
                if (pinInputs[0]) pinInputs[0].focus();
            }, 100);
        }

        // Verify PIN in modal
        async function verifyModalPIN() {
            const pinInputs = document.querySelectorAll('.membership-modal .pin-digit');
            const pin = Array.from(pinInputs).map(inp => inp.value).join('');

            if (pin.length !== 6) {
                document.getElementById('modalPinError').textContent = '❌ กรุณากรอกรหัส 6 หลัก';
                document.getElementById('modalPinError').style.display = 'block';
                return;
            }

            document.getElementById('modalPinError').style.display = 'none';
            document.getElementById('modalPinLoading').style.display = 'block';

            try {
                const deviceId = await generateDeviceId();
                const response = await fetch('https://us-central1-appinjproject.cloudfunctions.net/verifyWebPin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin, deviceId, source: 'marketplace' })
                });

                const result = await response.json();

                if (result.success && result.user) {
                    // Save session
                    const sessionData = {
                        lineUserId: result.user.lineUserId,
                        displayName: result.user.displayName,
                        pictureUrl: result.user.pictureUrl,
                        sellerStatus: result.user.sellerStatus || 'verified', // Ensure verified if PIN successful
                        isPremium: result.user.isPremium || false,
                        deviceId,
                        savedAt: Date.now(),
                        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
                    };
                    localStorage.setItem('wit_line_session', JSON.stringify(sessionData));
                    sessionStorage.setItem('lineUserId', result.user.lineUserId);
                    lineUserId = result.user.lineUserId;

                    // Close modal
                    document.querySelector('.membership-modal-overlay')?.remove();

                    // ✅ Update header user badge
                    updateHeaderUserBadge(sessionData);

                    // Update UI
                    showToast(`✅ ยินดีต้อนรับ ${result.user.displayName}!`, 'success');
                    updateUsageBadge();
                } else {
                    document.getElementById('modalPinError').textContent = '❌ ' + (result.error || 'รหัสไม่ถูกต้อง');
                    document.getElementById('modalPinError').style.display = 'block';
                    pinInputs.forEach(inp => inp.value = '');
                    pinInputs[0]?.focus();
                }
            } catch (error) {
                console.error('PIN verify error:', error);
                document.getElementById('modalPinError').textContent = '❌ เกิดข้อผิดพลาด: ' + (error.message || 'กรุณาลองใหม่');
                document.getElementById('modalPinError').style.display = 'block';
            } finally {
                document.getElementById('modalPinLoading').style.display = 'none';
            }
        }

        // Generate device ID for session binding
        // ✅ Fixed: Use stable device ID from localStorage
        async function generateDeviceId() {
            // เช็คว่ามี device ID เก็บไว้แล้วหรือยัง - ถ้ามีใช้อันเดิม
            let existingDeviceId = localStorage.getItem('wit_device_id');
            if (existingDeviceId) {
                return existingDeviceId;
            }

            // Generate new stable device ID
            const salt = Math.random().toString(36).substring(2, 15) +
                Date.now().toString(36) +
                Math.random().toString(36).substring(2, 15);

            const encoder = new TextEncoder();
            const data = encoder.encode(salt);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const deviceId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 24);

            // บันทึกไว้ใช้ตลอด
            localStorage.setItem('wit_device_id', deviceId);
            return deviceId;
        }

        // 🎁 Check AI Quota before using (ใช้ฟรี 3 ครั้ง)
        async function checkAIQuota() {
            const FREE_LIMIT = 3;

            try {
                // ✅ Re-check session first
                let userId = lineUserId;
                if (!userId) {
                    const session = await checkSavedSession();
                    if (session && session.lineUserId) {
                        userId = session.lineUserId;
                        lineUserId = userId;
                        sessionStorage.setItem('lineUserId', userId);
                        console.log('🔄 checkAIQuota: Re-checked session, found:', session.displayName);
                    }
                }

                // ถ้า login แล้ว เช็คจาก Firestore
                if (userId) {
                    const usageDoc = await db.collection('ai_post_usage').doc(userId).get();
                    const userData = usageDoc.exists ? usageDoc.data() : { count: 0 };
                    const isPremium = userData.isPremium || false;
                    const usedCount = userData.count || 0;

                    // Premium = unlimited
                    if (isPremium) return true;

                    // Check free limit
                    if (usedCount >= FREE_LIMIT) {
                        showQuotaExhaustedModal();
                        return false;
                    }
                    return true;
                }

                // ไม่ได้ login → เช็คจาก localStorage
                const usedCount = parseInt(localStorage.getItem('ai_free_usage') || '0');

                if (usedCount >= FREE_LIMIT) {
                    showQuotaExhaustedModal();
                    return false;
                }

                return true;
            } catch (error) {
                console.error('Error checking quota:', error);
                return true; // Allow on error
            }
        }

        // Show quota exhausted modal - แจ้งเพิ่มเพื่อน LINE OA
        function showQuotaExhaustedModal() {
            const modal = document.createElement('div');
            modal.className = 'membership-modal-overlay';
            modal.innerHTML = `
                <div class="membership-modal">
                    <div class="membership-header" style="background: linear-gradient(135deg, #00C300 0%, #00A000 100%);">
                        <h3><i class="fab fa-line"></i> ใช้ต่อฟรี! เพิ่มเพื่อนเลย</h3>
                        <button class="close-btn" onclick="this.closest('.membership-modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="membership-body">
                        <div style="text-align: center; padding: 20px 0;">
                            <i class="fas fa-gift" style="font-size: 3rem; color: #00C300; margin-bottom: 15px;"></i>
                            <h4 style="margin-bottom: 10px; color: #333;">🎉 คุณใช้ AI สร้างโพสต์ฟรีครบ 3 ครั้งแล้ว!</h4>
                            <p style="color: #666; font-size: 0.95rem;">เพิ่มเพื่อน LINE OA เพื่อรับสิทธิ์ใช้ต่อ <strong>ฟรี!</strong></p>
                        </div>
                        
                        <div class="membership-benefits" style="margin: 20px 0;">
                            <div class="benefit-item" style="background: #f0fff0; border-color: #00C300;">
                                <i class="fas fa-check-circle" style="color: #00C300;"></i>
                                <span>เพิ่มเพื่อน + พิมพ์ "ขอรหัสผ่าน" → ใช้ AI ต่อได้ฟรี 5 ครั้ง</span>
                            </div>
                            <div class="benefit-item premium" style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-color: #ff9800;">
                                <i class="fas fa-crown" style="color: #ff9800;"></i>
                                <span>สมัคร Premium 99฿/เดือน → ใช้ AI ไม่จำกัด!</span>
                            </div>
                        </div>
                        
                        <a href="https://lin.ee/1YJsw47" target="_blank" class="line-add-btn" style="display: block; text-align: center; background: linear-gradient(135deg, #00C300 0%, #00A000 100%); font-size: 1.1rem; padding: 15px;">
                            <i class="fab fa-line" style="font-size: 1.3rem;"></i> เพิ่มเพื่อน LINE OA ตอนนี้!
                        </a>
                        
                        <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin-top: 15px;">
                            <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">📱 ขั้นตอนง่ายๆ:</p>
                            <ol style="margin: 0; padding-left: 20px; color: #666; font-size: 0.9rem;">
                                <li>กดปุ่ม "เพิ่มเพื่อน LINE OA" ด้านบน</li>
                                <li>พิมพ์ <strong>"ขอรหัสผ่าน"</strong> ในแชท</li>
                                <li>นำรหัส 6 หลักมากรอกที่นี่</li>
                                <li>ใช้ AI สร้างโพสต์ได้ฟรีต่อเลย! 🎉</li>
                            </ol>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        // Update usage badge based on lineUserId
        async function updateUsageBadge() {
            const badge = document.getElementById('aiUsageBadge');
            const text = document.getElementById('aiUsageText');
            const sellBtn = document.getElementById('aiSellBtn');

            if (!lineUserId) {
                badge.className = 'ai-usage-badge';
                text.innerHTML = '🔓 <a href="#" onclick="showMembershipModal(); return false;" style="color:#667eea;">เข้าสู่ระบบด้วย PIN</a> เพื่อลงขายสินค้า';
                return;
            }

            try {
                // ดึงข้อมูลการใช้งานจาก Firestore
                const usageDoc = await db.collection('ai_post_usage').doc(lineUserId).get();
                const userData = usageDoc.exists ? usageDoc.data() : { count: 0 };
                const isPremium = userData.isPremium || false;
                const usedCount = userData.count || 0;
                const FREE_LIMIT = 5;

                if (isPremium) {
                    badge.className = 'ai-usage-badge premium';
                    text.innerHTML = '👑 <strong>Premium</strong> - ใช้ได้ไม่จำกัดตลอดชีพ';
                    sellBtn.disabled = false;
                } else if (usedCount < FREE_LIMIT) {
                    const remaining = FREE_LIMIT - usedCount;
                    badge.className = 'ai-usage-badge';
                    text.innerHTML = `🎁 ใช้ฟรีคงเหลือ: <strong>${remaining}/${FREE_LIMIT}</strong> ครั้ง`;
                    sellBtn.disabled = false;
                } else {
                    badge.className = 'ai-usage-badge exhausted';
                    text.innerHTML = '🔒 หมดสิทธิ์ใช้ฟรีแล้ว - <a href="https://lin.ee/1YJsw47" target="_blank" style="color:#667eea;font-weight:600;">อัพเกรด Premium</a>';
                    sellBtn.disabled = true;
                }
            } catch (error) {
                console.error('Error fetching usage:', error);
            }
        }

        // Reset AI Generator
        function resetAIGenerator() {
            document.getElementById('aiUploadSection').style.display = 'block';
            document.getElementById('aiLoading').style.display = 'none';
            document.getElementById('aiResult').style.display = 'none';
            resetAIUpload();
            document.getElementById('aiExtraInfo').value = '';
            currentAIPost = null;
        }

        // Show toast
        function showToast(message, type = 'default') {
            const toast = document.getElementById('aiToast');
            toast.textContent = message;
            toast.className = 'ai-toast show';
            if (type === 'success') toast.classList.add('success');

            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        // =====================================================
        // 📱 LINE AI POST DATA RECEIVER
        // รับข้อมูลจาก LINE OA ผ่าน URL Parameter
        // =====================================================

        // เก็บ LINE User ID สำหรับติดตามการใช้งาน
        // ยกระดับ lineUserId ไปใช้ global state ที่ประกาศไว้ด้านบนแล้ว
        lineUserId = sessionStorage.getItem('lineUserId') || null;

        // Check saved PIN session
        // ✅ Fixed: Check BOTH session keys (wizmobiz_session + wit_line_session)
        // Session management is now unified in WizmobizAuth.
        // checkSavedSession removed as it's redundant with WizmobizAuth.getSession()

        async function checkLineAIPostData() {
            const urlParams = new URLSearchParams(window.location.search);
            const aipostParam = urlParams.get('aipost');
            const lineUserIdParam = urlParams.get('lineUserId');

            // Priority 1: Get from URL parameter (from LINE OA direct)
            if (lineUserIdParam) {
                lineUserId = lineUserIdParam;
                const deviceId = await generateDeviceId();

                // Try to get user info from backend
                try {
                    const response = await fetch('https://us-central1-appinjproject.cloudfunctions.net/marketplaceLineAuth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lineUserId: lineUserIdParam })
                    });
                    const result = await response.json();

                    if (result.success && result.user) {
                        const sessionData = {
                            lineUserId,
                            displayName: result.user.displayName,
                            pictureUrl: result.user.pictureUrl,
                            sellerStatus: result.user.sellerStatus || 'verified',
                            isPremium: result.user.isPremium || false,
                            deviceId,
                            savedAt: Date.now(),
                            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
                        };
                        localStorage.setItem('wit_line_session', JSON.stringify(sessionData));
                        sessionStorage.setItem('lineUserId', lineUserId);
                        console.log('📱 LINE User logged in:', result.user.displayName);

                        // Update header badge via unified auth
                        WizmobizAuth.initHeaderUI();
                    }
                } catch (e) {
                    console.error('Error fetching user info:', e);
                    const sessionData = {
                        lineUserId,
                        deviceId,
                        savedAt: Date.now(),
                        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
                    };
                    localStorage.setItem('wit_line_session', JSON.stringify(sessionData));
                    sessionStorage.setItem('lineUserId', lineUserId);
                }

                console.log('📱 LINE User ID from URL:', lineUserId);
            }

            // Priority 2: Check saved session via Unified Auth
            if (!lineUserId) {
                const user = WizmobizAuth.getUser();
                if (user) {
                    lineUserId = user.lineUserId || user.uid;
                    sessionStorage.setItem('lineUserId', lineUserId);
                    console.log('📱 LINE User ID from unified session:', lineUserId);
                }
            }

            // Case 1: aipost=1 - เปิด modal ให้อัพโหลดรูป (มาจาก LINE)
            if (aipostParam === '1') {
                console.log('📱 Opening AI Generator from LINE');

                setTimeout(() => {
                    // Open the AI modal
                    const aiModal = new bootstrap.Modal(document.getElementById('aiGeneratorModal'));
                    aiModal.show();

                    // Reset to upload section
                    document.getElementById('aiUploadSection').style.display = 'block';
                    document.getElementById('aiLoading').style.display = 'none';
                    document.getElementById('aiResult').style.display = 'none';

                    // Show welcome message
                    showToast('📸 อัพโหลดรูปสินค้าเพื่อให้ AI สร้างโพสต์!', 'info');

                    // Clean URL (remove params but keep page)
                    const cleanUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }, 500);

                return;
            }

            // Case 2: aipost เป็น base64 data - แสดงผลลัพธ์ AI (legacy support)
            if (aipostParam && aipostParam !== '1') {
                try {
                    // Decode base64 data from LINE
                    const decodedData = JSON.parse(atob(decodeURIComponent(aipostParam)));
                    console.log('📱 Received AI Post from LINE:', decodedData);

                    // Set current AI post
                    currentAIPost = decodedData;

                    // Auto open modal and display result
                    setTimeout(() => {
                        // Open the AI modal
                        const aiModal = new bootstrap.Modal(document.getElementById('aiGeneratorModal'));
                        aiModal.show();

                        // Show result directly (skip upload section)
                        document.getElementById('aiUploadSection').style.display = 'none';
                        document.getElementById('aiLoading').style.display = 'none';
                        document.getElementById('aiResult').style.display = 'block';

                        // Display the data
                        displayAIResult(currentAIPost);

                        // Show welcome toast
                        showToast('🎉 โพสต์จาก LINE OA พร้อมคัดลอก!', 'success');

                        // Clean URL (remove aipost param)
                        const cleanUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }, 500);

                } catch (error) {
                    console.error('❌ Error parsing LINE AI Post data:', error);
                }
            }
        }

        // Check on page load
        document.addEventListener('DOMContentLoaded', async function () {
            console.log('🚀 Marketplace Initializing...');

            // ✅ Run in sequence to avoid race condition
            await checkLineAIPostData();
            await checkAndShowUserBadge();
            await loadUserSavedItems();

            // Load Core Data
            loadProducts(); // Load Secondhand
            loadCommunityProducts(); // Load Community
            checkSuperAdmin(); // Check Admin Rights

            // Handle Deep Links
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product') || urlParams.get('productId');
            if (productId) {
                console.log('🔗 Deep link found:', productId);
                setTimeout(() => viewProduct(productId), 1000);
            }

            // Initialize footers
            initFooterState('mainFooter');
            initFooterState('communityFooter');

            console.log('🔐 Init complete. lineUserId:', lineUserId);
        });

        // Unified User Badge Management using WizmobizAuth
        async function checkAndShowUserBadge() {
            const user = WizmobizAuth.getUser();
            if (user) {
                lineUserId = user.lineUserId || user.uid;
                sessionStorage.setItem('lineUserId', lineUserId);
                console.log('👤 User logged in (Unified):', user.displayName);

                // Show marketplace-specific buttons
                const myShop = document.getElementById('headerMyShop');
                const sellBtn = document.getElementById('headerSellBtn');
                if (myShop) myShop.style.display = 'flex';
                if (sellBtn) sellBtn.style.display = 'flex';
            } else {
                console.log('👤 No user session found');
            }

            // Re-sync UI with auth.js rendered elements
            WizmobizAuth.initHeaderUI();
        }

        function logoutUser() {
            WizmobizAuth.logout();
            location.reload();
        }

        // ========================================
        // SUPER ADMIN ADS MANAGEMENT
        // ========================================

        // Super Admin IDs - ผู้ที่มีสิทธิ์จัดการโฆษณา
        // ใช้รายชื่อเดียวกับ super-admin.html
        // SUPER_ADMIN_IDS moved to top of file

        // Ads State
        let allAds = [];
        let currentPromoSlide = 0;
        let promoSlideInterval = null;
        let isSuperAdminUser = false;  // ✅ เก็บสถานะ Super Admin

        // Ad Image Helper Functions
        function handleAdFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                showToast('❌ ไฟล์ใหญ่เกินไป (สูงสุด 5MB)', 'error');
                return;
            }

            selectedAdFile = file;
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('adImagePreview');
                const wrapper = document.getElementById('adImagePreviewWrapper');
                const placeholder = document.getElementById('adUploadPlaceholder');
                const uploadArea = document.getElementById('adUploadArea');

                if (preview && wrapper && placeholder) {
                    preview.src = e.target.result;
                    wrapper.style.display = 'block';
                    placeholder.style.display = 'none';
                    if (uploadArea) uploadArea.classList.add('has-image');
                }
            };
            reader.readAsDataURL(file);
        }

        function clearAdImage() {
            selectedAdFile = null;
            document.getElementById('adFileSelect').value = '';
            document.getElementById('adImageUrl').value = '';
            document.getElementById('adImagePreview').src = '';
            document.getElementById('adImagePreviewWrapper').style.display = 'none';
            document.getElementById('adUploadPlaceholder').style.display = 'block';
            const uploadArea = document.getElementById('adUploadArea');
            if (uploadArea) uploadArea.classList.remove('has-image');
        }

        function resetAdForm() {
            document.getElementById('createAdForm').reset();
            document.getElementById('editingAdId').value = '';
            document.getElementById('adImageUrl').value = '';
            document.getElementById('adSubmitBtn').innerHTML = '<i class="fas fa-plus-circle"></i> เพิ่มโฆษณา';

            // Reset image UI
            document.getElementById('adImagePreviewWrapper').style.display = 'none';
            document.getElementById('adUploadPlaceholder').style.display = 'block';
            const uploadArea = document.getElementById('adUploadArea');
            if (uploadArea) uploadArea.classList.remove('has-image');

            selectedAdFile = null;
        }

        // Check if current user is Super Admin
        async function checkSuperAdmin() {
            const fab = document.getElementById('adminAdsFab');

            // Get current user ID from unified Auth system
            const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            let userId = user ? (user.lineUserId || user.uid) : lineUserId;

            if (!userId) {
                const session = await checkSavedSession();
                if (session && session.lineUserId) {
                    userId = session.lineUserId;
                }
            }

            if (!userId) {
                console.log('🔐 User not logged in, Admin FAB hidden');
                return false;
            }

            // 🚀 DEV MODE: ปิดเพื่อใช้การตรวจสอบจริง
            const DEV_MODE = false;

            if (DEV_MODE) {
                console.log('🔧 DEV MODE: Admin FAB shown for everyone');
                if (fab) fab.classList.add('show');
                isSuperAdminUser = true;
                return true;
            }

            // Check hardcoded list FIRST as it's fastest and doesn't require network
            if (SUPER_ADMIN_IDS.includes(userId)) {
                console.log('👑 Super Admin (hardcoded):', userId);
                if (fab) fab.classList.add('show');
                isSuperAdminUser = true;
                return true;
            }

            // Then check from Firestore super_admins collection
            try {
                // If we know we're offline, don't even try and throw an error, just use cache or fail gracefully
                const adminDoc = await db.collection('super_admins').doc(userId).get();

                if (adminDoc.exists && adminDoc.data().isActive) {
                    console.log('👑 Super Admin verified via Firestore:', userId);
                    if (fab) fab.classList.add('show');
                    isSuperAdminUser = true;
                    return true;
                }
            } catch (error) {
                if (error.code === 'unavailable' || error.message.includes('offline')) {
                    console.warn('🔐 Firestore offline, using local admin check only');
                } else {
                    console.error('Error checking super admin:', error);
                }

                // Final fallback (already checked above but safe to re-check)
                if (SUPER_ADMIN_IDS.includes(userId)) {
                    if (fab) fab.classList.add('show');
                    isSuperAdminUser = true;
                    return true;
                }
            }

            console.log('🔐 Not a Super Admin, FAB hidden');
            isSuperAdminUser = false;
            return false;
        }

        // Open Admin Ads Modal
        function openAdminAdsModal() {
            document.getElementById('adminAdsModal').classList.add('show');
            document.body.style.overflow = 'hidden';
            loadAdsList();
        }

        // Close Admin Ads Modal
        function closeAdminAdsModal() {
            document.getElementById('adminAdsModal').classList.remove('show');
            document.body.style.overflow = '';
            resetAdForm();
        }

        // Switch between tabs
        function switchAdsTab(tab) {
            // Update tabs
            document.querySelectorAll('.admin-ads-tab').forEach(t => t.classList.remove('active'));
            event.target.closest('.admin-ads-tab').classList.add('active');

            // Show/hide content
            document.getElementById('adsTabCreate').style.display = tab === 'create' ? 'block' : 'none';
            document.getElementById('adsTabList').style.display = tab === 'list' ? 'block' : 'none';

            if (tab === 'list') {
                loadAdsList();
            }
        }

        // Handle Create/Update Ad
        async function handleCreateAd(event) {
            event.preventDefault();

            // ✅ ตรวจสอบสิทธิ์ Super Admin ก่อน
            if (!isSuperAdminUser) {
                showToast('❌ คุณไม่มีสิทธิ์จัดการโฆษณา (Super Admin Only)', 'error');
                console.log('🚫 Unauthorized: Not a Super Admin');
                return;
            }

            const adId = document.getElementById('editingAdId').value;
            const isEditing = !!adId;

            const adData = {
                title: document.getElementById('adTitle').value.trim(),
                description: document.getElementById('adDescription').value.trim(),
                imageUrl: document.getElementById('adImageUrl').value.trim(),
                targetUrl: document.getElementById('adTargetUrl').value.trim(),
                type: document.getElementById('adType').value,
                order: parseInt(document.getElementById('adOrder').value) || 0,
                startDate: document.getElementById('adStartDate').value || null,
                endDate: document.getElementById('adEndDate').value || null,
                sponsor: document.getElementById('adSponsor').value.trim(),
                isActive: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (!isEditing) {
                adData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                adData.createdBy = lineUserId || 'admin';
                adData.clicks = 0;
                adData.views = 0;
            }

            try {
                const btn = document.getElementById('adSubmitBtn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';

                // ✅ Handle file upload if exists
                if (selectedAdFile) {
                    const fileName = `ads/${Date.now()}_${selectedAdFile.name}`;
                    const storageRef = storage.ref().child(fileName);
                    const uploadTask = await storageRef.put(selectedAdFile);
                    const downloadUrl = await uploadTask.ref.getDownloadURL();
                    adData.imageUrl = downloadUrl;
                }

                if (isEditing) {
                    await db.collection('marketplace_ads').doc(adId).update(adData);
                    showToast('✅ แก้ไขโฆษณาสำเร็จ!', 'success');
                } else {
                    await db.collection('marketplace_ads').add(adData);
                    showToast('✅ เพิ่มโฆษณาสำเร็จ!', 'success');
                }

                resetAdForm();
                loadAdsList();
                loadPromotions(); // Reload promotions on page

            } catch (error) {
                console.error('Error saving ad:', error);
                showToast('❌ เกิดข้อผิดพลาด: ' + error.message, 'error');
            } finally {
                const btn = document.getElementById('adSubmitBtn');
                btn.disabled = false;
                btn.innerHTML = isEditing ? '<i class="fas fa-save"></i> บันทึกการแก้ไข' : '<i class="fas fa-plus-circle"></i> เพิ่มโฆษณา';
            }
        }


        // Load Ads List
        async function loadAdsList() {
            const container = document.getElementById('adsList');
            const emptyState = document.getElementById('adsEmptyState');

            try {
                const snapshot = await db.collection('marketplace_ads')
                    .orderBy('order', 'asc')
                    .get();

                allAds = [];
                snapshot.forEach(doc => {
                    allAds.push({ id: doc.id, ...doc.data() });
                });

                if (allAds.length === 0) {
                    emptyState.style.display = 'block';
                    return;
                }

                emptyState.style.display = 'none';

                container.innerHTML = allAds.map(ad => `
                    <div class="ads-list-item" data-id="${ad.id}">
                        <img class="ads-list-img" 
                             src="${ad.imageUrl || 'https://placehold.co/70x70?text=No+Image'}" 
                             alt="${ad.title}"
                             onerror="this.onerror=null; this.src='https://placehold.co/70x70?text=Error'">
                        <div class="ads-list-info">
                            <h5>${ad.title}</h5>
                            <p>${ad.description || 'ไม่มีรายละเอียด'}</p>
                            <div class="ads-list-meta">
                                <span class="ads-list-badge ${ad.isActive ? 'active' : 'inactive'}">
                                    ${ad.isActive ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน'}
                                </span>
                                <span class="ads-list-badge ${ad.type}">
                                    ${ad.type === 'banner' ? '🖼️ Banner' : '🃏 Card'}
                                </span>
                                <span class="ads-list-badge clicks" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9; border: 1px solid rgba(14, 165, 233, 0.2);">
                                    <i class="fas fa-mouse-pointer"></i> ยอดคลิก: <strong>${ad.clicks || 0}</strong>
                                </span>
                            </div>
                        </div>
                        <div class="ads-list-actions">
                            <button class="ads-list-btn toggle" onclick="toggleAdStatus('${ad.id}', ${!ad.isActive})" title="${ad.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}">
                                <i class="fas ${ad.isActive ? 'fa-pause' : 'fa-play'}"></i>
                            </button>
                            <button class="ads-list-btn edit" onclick="editAd('${ad.id}')" title="แก้ไข">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="ads-list-btn delete" onclick="deleteAd('${ad.id}')" title="ลบ">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');

            } catch (error) {
                console.error('Error loading ads:', error);
                container.innerHTML = `
                    <div class="ads-empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>เกิดข้อผิดพลาดในการโหลด</p>
                    </div>
                `;
            }
        }

        // Edit Ad
        function editAd(adId) {
            // ✅ ตรวจสอบสิทธิ์
            if (!isSuperAdminUser) {
                showToast('❌ คุณไม่มีสิทธิ์แก้ไขโฆษณา', 'error');
                return;
            }

            const ad = allAds.find(a => a.id === adId);
            if (!ad) return;

            // Switch to create tab
            document.querySelectorAll('.admin-ads-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.admin-ads-tab').classList.add('active');
            document.getElementById('adsTabCreate').style.display = 'block';
            document.getElementById('adsTabList').style.display = 'none';

            // Fill form
            document.getElementById('editingAdId').value = adId;
            document.getElementById('adTitle').value = ad.title || '';
            document.getElementById('adDescription').value = ad.description || '';
            document.getElementById('adImageUrl').value = ad.imageUrl || '';
            document.getElementById('adTargetUrl').value = ad.targetUrl || '';
            document.getElementById('adType').value = ad.type || 'banner';
            document.getElementById('adOrder').value = ad.order || 0;
            document.getElementById('adStartDate').value = ad.startDate || '';
            document.getElementById('adEndDate').value = ad.endDate || '';
            document.getElementById('adSponsor').value = ad.sponsor || '';

            // Show preview if image exists
            if (ad.imageUrl) {
                document.getElementById('adImagePreview').src = ad.imageUrl;
                document.getElementById('adImagePreviewWrapper').style.display = 'block';
                document.getElementById('adUploadPlaceholder').style.display = 'none';
                const uploadArea = document.getElementById('adUploadArea');
                if (uploadArea) uploadArea.classList.add('has-image');
            } else {
                document.getElementById('adImagePreviewWrapper').style.display = 'none';
                document.getElementById('adUploadPlaceholder').style.display = 'block';
                const uploadArea = document.getElementById('adUploadArea');
                if (uploadArea) uploadArea.classList.remove('has-image');
            }

            // Update button text
            document.getElementById('adSubmitBtn').innerHTML = '<i class="fas fa-save"></i> บันทึกการแก้ไข';

            showToast('📝 กำลังแก้ไข: ' + ad.title, 'info');
        }

        // Toggle Ad Status
        async function toggleAdStatus(adId, newStatus) {
            // ✅ ตรวจสอบสิทธิ์
            if (!isSuperAdminUser) {
                showToast('❌ คุณไม่มีสิทธิ์เปลี่ยนสถานะโฆษณา', 'error');
                return;
            }

            try {
                await db.collection('marketplace_ads').doc(adId).update({
                    isActive: newStatus,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast(newStatus ? '✅ เปิดใช้งานโฆษณาแล้ว' : '⏸️ ปิดใช้งานโฆษณาแล้ว', 'success');
                loadAdsList();
                loadPromotions();
            } catch (error) {
                console.error('Error toggling ad:', error);
                showToast('❌ เกิดข้อผิดพลาด', 'error');
            }
        }

        // Delete Ad
        async function deleteAd(adId) {
            // ✅ ตรวจสอบสิทธิ์
            if (!isSuperAdminUser) {
                showToast('❌ คุณไม่มีสิทธิ์ลบโฆษณา', 'error');
                return;
            }

            if (!confirm('⚠️ ต้องการลบโฆษณานี้หรือไม่?')) return;

            try {
                await db.collection('marketplace_ads').doc(adId).delete();
                showToast('🗑️ ลบโฆษณาสำเร็จ', 'success');
                loadAdsList();
                loadPromotions();
            } catch (error) {
                console.error('Error deleting ad:', error);
                showToast('❌ เกิดข้อผิดพลาด', 'error');
            }
        }

        // ========================================
        // LOAD & DISPLAY PROMOTIONS
        // ========================================

        // Load promotions from Firestore
        async function loadPromotions() {
            try {
                const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

                const snapshot = await db.collection('marketplace_ads')
                    .where('isActive', '==', true)
                    .orderBy('order', 'asc')
                    .get();

                const banners = [];
                const cards = [];

                snapshot.forEach(doc => {
                    const ad = { id: doc.id, ...doc.data() };

                    // Check date validity
                    if (ad.startDate && ad.startDate > now) return;
                    if (ad.endDate && ad.endDate < now) return;

                    if (ad.type === 'banner') {
                        banners.push(ad);
                    } else {
                        cards.push(ad);
                    }
                });

                // Render banners
                renderPromoBanners(banners);

                // Render cards
                renderPromoCards(cards);

            } catch (error) {
                console.error('Error loading promotions:', error);
            }
        }

        // Render Banner Slider
        function renderPromoBanners(banners) {
            const section = document.getElementById('promoBannerSection');
            const slider = document.getElementById('promoSlider');
            const dots = document.getElementById('promoDots');

            if (banners.length === 0) {
                section.classList.remove('has-banners');
                return;
            }

            section.classList.add('has-banners');

            // Render slides
            slider.innerHTML = banners.map((banner, i) => `
                <div class="promo-slide" onclick="handlePromoClick('${banner.id}', '${banner.targetUrl || ''}')" data-index="${i}">
                    <img src="${banner.imageUrl || 'https://placehold.co/800x200?text=Promo'}" 
                         alt="${banner.title}"
                         onerror="this.onerror=null; this.src='https://placehold.co/800x200?text=No+Image'">
                    ${banner.sponsor ? `<span class="promo-sponsor">Sponsored by ${banner.sponsor}</span>` : ''}
                    <div class="promo-slide-overlay">
                        <div class="promo-slide-title">${banner.title}</div>
                        ${banner.description ? `<div class="promo-slide-desc">${banner.description}</div>` : ''}
                    </div>
                </div>
            `).join('');

            // Render dots
            dots.innerHTML = banners.map((_, i) => `
                <button class="promo-dot ${i === 0 ? 'active' : ''}" onclick="goToPromoSlide(${i})"></button>
            `).join('');

            // Start auto-slide
            currentPromoSlide = 0;
            startPromoSlider(banners.length);
        }

        // Render Promo Cards
        function renderPromoCards(cards) {
            const section = document.getElementById('promoCardsSection');
            const grid = document.getElementById('promoCardsGrid');

            if (cards.length === 0) {
                section.classList.remove('has-cards');
                return;
            }

            section.classList.add('has-cards');

            grid.innerHTML = cards.map(card => `
                <div class="promo-card" onclick="handlePromoClick('${card.id}', '${card.targetUrl || ''}')">
                    ${card.sponsor ? `<span class="promo-card-badge">Sponsored</span>` : `<span class="promo-card-badge">โปรโมชั่น</span>`}
                    <div class="promo-card-content">
                        <img class="promo-card-img" 
                             src="${card.imageUrl || 'https://placehold.co/80x80?text=Ad'}" 
                             alt="${card.title}"
                             onerror="this.onerror=null; this.src='https://placehold.co/80x80?text=No+Image'">
                        <div class="promo-card-info">
                            <h4>${card.title}</h4>
                            <p>${card.description || ''}</p>
                            <div class="promo-card-cta">
                                ดูเพิ่มเติม <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Handle promo click - track and redirect
        async function handlePromoClick(adId, targetUrl) {
            console.log('🎯 Ad Clicked:', adId, 'Target:', targetUrl);

            // 📊 Track click in detailed analytics (Fire and forget)
            if (window.tuktukTrackEvent) {
                try {
                    window.tuktukTrackEvent('ad_click', {
                        adId: adId,
                        page: window.location.pathname,
                        targetUrl: targetUrl
                    });
                } catch (e) { }
            }

            // Track click count in Firestore (Fire and forget - NO AWAIT)
            try {
                db.collection('marketplace_ads').doc(adId).update({
                    clicks: firebase.firestore.FieldValue.increment(1)
                });
            } catch (e) {
                console.warn('Could not track click:', e);
            }

            // Redirect IMMEDIATELY to avoid popup blockers
            if (targetUrl) {
                let url = targetUrl.trim();
                // Ensure protocol exists
                if (url && !url.startsWith('http') && !url.startsWith('//') && !url.startsWith('/') && !url.startsWith('#')) {
                    url = 'https://' + url;
                }

                if (url) {
                    // Try to open in new tab
                    const win = window.open(url, '_blank');

                    // If window.open was blocked or failed (common in LINE/Mobile), use current window
                    if (!win) {
                        window.location.href = url;
                    }
                }
            }
        }

        // Slider Navigation
        function startPromoSlider(total) {
            if (promoSlideInterval) clearInterval(promoSlideInterval);

            if (total <= 1) return;

            promoSlideInterval = setInterval(() => {
                nextPromoSlide();
            }, 5000); // Change every 5 seconds
        }

        function goToPromoSlide(index) {
            const slider = document.getElementById('promoSlider');
            const dots = document.querySelectorAll('.promo-dot');
            const slides = slider.querySelectorAll('.promo-slide');

            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;

            currentPromoSlide = index;
            slider.style.transform = `translateX(-${index * 100}%)`;

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        function nextPromoSlide() {
            const slider = document.getElementById('promoSlider');
            const slides = slider.querySelectorAll('.promo-slide');
            goToPromoSlide((currentPromoSlide + 1) % slides.length);
        }

        function prevPromoSlide() {
            const slider = document.getElementById('promoSlider');
            const slides = slider.querySelectorAll('.promo-slide');
            goToPromoSlide((currentPromoSlide - 1 + slides.length) % slides.length);
        }

        // Preview image when URL changes
        document.addEventListener('DOMContentLoaded', function () {
            const imageInput = document.getElementById('adImageUrl');
            if (imageInput) {
                imageInput.addEventListener('blur', function () {
                    const url = this.value.trim();
                    const preview = document.getElementById('adImagePreview');
                    const container = document.getElementById('adImagePreviewContainer');

                    if (url) {
                        preview.src = url;
                        container.style.display = 'block';
                        preview.onerror = () => {
                            container.style.display = 'none';
                        };
                    } else {
                        container.style.display = 'none';
                    }
                });
            }
        });

        // Initialize promotions and check admin on page load
        document.addEventListener('DOMContentLoaded', async function () {
            // Load promotions immediately
            await loadPromotions();

            // Check if user is super admin (after a short delay for session to load)
            setTimeout(async () => {
                await checkSuperAdmin();
            }, 1000);
        });

        // ========================================
        // COMMUNITY SHORTS LOGIC
        // ========================================

        async function loadCommunityVideos() {
            const container = document.getElementById('communityShortsContainer');
            if (!container) return;

            try {
                // Fetch videos from community_posts collection
                const snapshot = await db.collection('community_posts')
                    .where('published', '!=', false)
                    .orderBy('published') // work-around for multiple where/orderBy if needed, or index
                    .limit(20)
                    .get();

                let videos = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Check if it's a video item or has embed
                    const isVideoCat = data.category === 'video';
                    const hasEmbed = data.videoEmbed;
                    const hasVideoFile = data.images && data.images.some(img =>
                        (typeof img === 'object' && img.type === 'video') ||
                        (typeof img === 'string' && img.match(/\.(mp4|webm|ogg|mov)$/i))
                    );

                    if (isVideoCat || hasEmbed || hasVideoFile) {
                        videos.push({ id: doc.id, ...data });
                    }
                });

                if (videos.length === 0) {
                    container.innerHTML = '<div class="text-center w-100 py-4 opacity-50">ยังไม่มีวิดีโอจากชุมชน</div>';
                    return;
                }

                // Randomize videos
                videos.sort(() => Math.random() - 0.5);

                container.innerHTML = videos.slice(0, 10).map(vid => {
                    let videoHtml = '';

                    // Priority: YouTube/Embed > Direct Video
                    if (vid.videoEmbed) {
                        // Make sure iframe is responsive and clean
                        videoHtml = vid.videoEmbed.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"');
                    } else {
                        const videoFile = vid.images && vid.images.find(img =>
                            (typeof img === 'object' && img.type === 'video') ||
                            (typeof img === 'string' && img.match(/\.(mp4|webm|ogg|mov)$/i))
                        );
                        const videoUrl = typeof videoFile === 'object' ? videoFile.url : videoFile;

                        if (videoUrl) {
                            videoHtml = `
                                <video loop muted playsinline onmouseover="this.play()" onmouseout="this.pause()">
                                    <source src="${videoUrl}" type="video/mp4">
                                </video>
                            `;
                        } else if (vid.youtubeUrl) {
                            // Extract ID if only URL exists
                            const extractId = (url) => {
                                const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                                const match = url.match(regex);
                                return match ? match[1] : null;
                            };
                            const yid = extractId(vid.youtubeUrl);
                            if (yid) {
                                videoHtml = `<iframe src="https://www.youtube.com/embed/${yid}?controls=0&modestbranding=1&rel=0" allowfullscreen></iframe>`;
                            }
                        }
                    }

                    if (!videoHtml) return '';

                    return `
                        <div class="short-card" onclick="window.location.href='/?postId=${vid.id}'">
                            <div class="short-video-wrapper">
                                ${videoHtml}
                            </div>
                            <div class="short-overlay">
                                <div class="short-caption">${vid.title || 'WiT Community'}</div>
                                <div class="short-tags">
                                    <span class="short-tag">#${vid.category || 'shorts'}</span>
                                    <span class="short-tag"><i class="fas fa-eye"></i> ${vid.views || 0}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.error("Error loading shorts:", err);
                container.innerHTML = '<div class="text-center w-100 py-4 opacity-50">โหลดวิดีโอไม่สำเร็จ</div>';
            }
        }

        // Initialize Shorts
        document.addEventListener('DOMContentLoaded', () => {
            loadCommunityVideos();
        });

        // ========================================
        // COMMUNITY MARKET FUNCTIONS
        // ========================================

        // Current market type
        let currentMarketType = 'secondhand';
        let filteredCommunityProducts = [];
        let currentCommunitySort = 'newest';

        // Switch between markets
        function switchMarket(marketType) {
            currentMarketType = marketType;

            // Update tabs
            document.querySelectorAll('.market-type-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            if (marketType === 'secondhand') {
                document.querySelector('.market-type-tab.secondhand').classList.add('active');
                document.getElementById('secondhandMarket').style.display = 'block';
                document.getElementById('communityMarket').style.display = 'none';
            } else {
                document.querySelector('.market-type-tab.community').classList.add('active');
                document.getElementById('secondhandMarket').style.display = 'none';
                document.getElementById('communityMarket').style.display = 'block';

                // Load community products if not loaded yet
                if (allCommunityProducts.length === 0) {
                    loadCommunityProducts();
                }
            }

            // Scroll to top of content
            window.scrollTo({ top: 400, behavior: 'smooth' });
        }

        // Load Community Products from Firestore with Pagination
        async function loadCommunityProducts(isLoadMore = false) {
            if (isCommunityLoading) return;

            try {
                isCommunityLoading = true;
                const container = document.getElementById('communityProductsGrid');
                const loading = document.getElementById('communityLoading');
                const loadMoreBtn = document.getElementById('btnLoadMoreCommunity');
                const loadMoreContainer = document.getElementById('loadMoreCommunityContainer');
                const loadMoreSpinner = document.getElementById('loadMoreCommunitySpinner');

                if (!isLoadMore) {
                    if (loading) loading.style.display = 'flex';
                    container.innerHTML = renderCommunitySkeletons(6);
                    allCommunityProducts = [];
                    lastCommunityDoc = null;
                } else {
                    loadMoreBtn.style.display = 'none';
                    loadMoreSpinner.style.display = 'block';
                }

                let query = db.collection('community_products')
                    .where('status', '==', 'active')
                    .orderBy('createdAt', 'desc');

                if (lastCommunityDoc) {
                    query = query.startAfter(lastCommunityDoc);
                }

                const snapshot = await query.limit(PAGE_LIMIT).get();

                if (snapshot.empty) {
                    if (!isLoadMore) {
                        // Keep current empty state logic or do nothing if already handled
                    }
                    loadMoreContainer.style.display = 'none';
                } else {
                    lastCommunityDoc = snapshot.docs[snapshot.docs.length - 1];
                    const newProducts = [];
                    snapshot.forEach(doc => {
                        newProducts.push({ id: doc.id, ...doc.data() });
                    });

                    allCommunityProducts = isLoadMore ? [...allCommunityProducts, ...newProducts] : newProducts;

                    // Show/Hide load more button
                    loadMoreContainer.style.display = snapshot.docs.length < PAGE_LIMIT ? 'none' : 'block';

                    // Update counts
                    updateCommunityCountsVal();

                    // Render products (Note: renderCommunityProducts might need to be called differently)
                    renderCommunityProducts(allCommunityProducts);
                }

            } catch (error) {
                console.error('Error loading community products:', error);
                const isConnectionError = error.code === 'unavailable' || error.message.includes('backend') || error.message.includes('offline');
                const errMsg = isConnectionError ? 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' : 'เกิดข้อผิดพลาดในการโหลดสินค้า';

                if (!isLoadMore) {
                    const container = document.getElementById('communityProductsGrid');
                    if (container) {
                        container.innerHTML = renderEmptyState(errMsg, true, 'loadCommunityProducts()');
                    }
                }
            } finally {
                isCommunityLoading = false;
                const communityLoadingEl = document.getElementById('communityLoading');
                if (communityLoadingEl) communityLoadingEl.style.display = 'none';

                const loadMoreCommunitySpinner = document.getElementById('loadMoreCommunitySpinner');
                if (loadMoreCommunitySpinner) loadMoreCommunitySpinner.style.display = 'none';

                const loadMoreCommunityContainer = document.getElementById('loadMoreCommunityContainer');
                const btnLoadMoreCommunity = document.getElementById('btnLoadMoreCommunity');

                if (loadMoreCommunityContainer && loadMoreCommunityContainer.style.display !== 'none' && btnLoadMoreCommunity) {
                    btnLoadMoreCommunity.style.display = 'inline-flex';
                }
            }
        }

        function loadMoreCommunityProducts() {
            loadCommunityProducts(true);
        }


        // Update category counts
        function updateCommunityCountsVal() {
            const countAll = document.getElementById('commCountAll');
            const countRice = document.getElementById('commCountRice');
            const countFruit = document.getElementById('commCountFruit');
            const countVeg = document.getElementById('commCountVeg');
            const countOtop = document.getElementById('commCountOtop');
            const countDrink = document.getElementById('commCountDrink');
            const countGift = document.getElementById('commCountGift');
            const countFabric = document.getElementById('commCountFabric');

            if (countAll) countAll.textContent = allCommunityProducts.length;
            if (countRice) countRice.textContent = allCommunityProducts.filter(p => p.category === 'ข้าว').length;
            if (countFruit) countFruit.textContent = allCommunityProducts.filter(p => p.category === 'ผลไม้').length;
            if (countVeg) countVeg.textContent = allCommunityProducts.filter(p => p.category === 'ผัก').length;
            if (countOtop) countOtop.textContent = allCommunityProducts.filter(p => p.category === 'OTOP' || p.isOTOP).length;
            if (countDrink) countDrink.textContent = allCommunityProducts.filter(p => p.category === 'เครื่องดื่ม').length;
            if (countGift) countGift.textContent = allCommunityProducts.filter(p => p.category === 'ของฝาก').length;
            if (countFabric) countFabric.textContent = allCommunityProducts.filter(p => p.category === 'ผ้าทอ').length;
        }

        // Filter community products by category
        function filterCommunity(category, event = null) {
            currentCommunityCategory = category;

            // Update active category card
            if (event) {
                document.querySelectorAll('.community-cat-card').forEach(card => {
                    card.classList.remove('active');
                });
                event.target.closest('.community-cat-card')?.classList.add('active');
            }

            // Filter products
            let filtered = [...allCommunityProducts];

            // Filter by category
            if (category !== 'all') {
                filtered = filtered.filter(p => {
                    if (category === 'OTOP') {
                        return p.category === 'OTOP' || p.isOTOP;
                    }
                    return p.category === category;
                });
            }

            // Filter by search query if exists
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(p => {
                    const name = (p.productName || '').toLowerCase();
                    const desc = (p.description || '').toLowerCase();
                    const tags = (p.tags || []).join(' ').toLowerCase();
                    return name.includes(query) || desc.includes(query) || tags.includes(query);
                });
                document.getElementById('commSectionTitle').textContent = `🔍 ผลการค้นหา "${searchQuery}"`;
            } else if (category === 'all') {
                document.getElementById('commSectionTitle').textContent = 'สินค้าแนะนำจากชุมชน';
            } else {
                document.getElementById('commSectionTitle').textContent = `🔍 ${category}`;
            }

            // Apply sort
            sortCommunityArray(filtered);

            renderCommunityProducts(filtered);
            return false;
        }

        // Sort community products
        function sortCommunityProducts() {
            currentCommunitySort = document.getElementById('commSortSelect').value;

            let products = currentCommunityCategory === 'all'
                ? [...allCommunityProducts]
                : allCommunityProducts.filter(p => {
                    if (currentCommunityCategory === 'OTOP') {
                        return p.category === 'OTOP' || p.isOTOP;
                    }
                    return p.category === currentCommunityCategory;
                });

            sortCommunityArray(products);
            renderCommunityProducts(products);
        }

        // Sort array helper
        function sortCommunityArray(products) {
            switch (currentCommunitySort) {
                case 'newest':
                    products.sort((a, b) => {
                        const dateA = a.createdAt?.toDate?.() || new Date(0);
                        const dateB = b.createdAt?.toDate?.() || new Date(0);
                        return dateB - dateA;
                    });
                    break;
                case 'popular':
                    products.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
                    break;
                case 'price-low':
                    products.sort((a, b) => (a.price || 0) - (b.price || 0));
                    break;
                case 'price-high':
                    products.sort((a, b) => (b.price || 0) - (a.price || 0));
                    break;
            }
        }

        // Render community products
        function renderCommunityProducts(products) {
            const container = document.getElementById('communityProductsGrid');

            if (products.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5" style="grid-column: 1/-1;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">🌾</div>
                        <h4 style="color: white;">ยังไม่มีสินค้าในหมวดหมู่นี้</h4>
                        <p style="color: rgba(255,255,255,0.7);">ลองเลือกหมวดหมู่อื่น หรือกลับมาใหม่ภายหลัง</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = products.map(product => renderCommunityProductCard(product)).join('');
            updateSavedButtonsUI();
        }

        // Render single community product card
        function renderCommunityProductCard(product) {
            const badge = product.isOTOP
                ? '<span class="community-product-badge community-badge-otop">OTOP</span>'
                : product.isOrganic
                    ? '<span class="community-product-badge community-badge-organic">อินทรีย์</span>'
                    : '';

            const stars = '★'.repeat(Math.floor(product.rating || 0)) + '☆'.repeat(5 - Math.floor(product.rating || 0));

            const tags = (product.tags || []).slice(0, 2).map(tag => {
                const isOrganic = tag.includes('อินทรีย์') || tag.includes('ออร์แกนิก');
                return `<span class="community-product-tag ${isOrganic ? 'organic' : ''}">${tag}</span>`;
            }).join('');

            const imageContent = product.imageUrl
                ? `<img src="${product.imageUrl}" alt="${product.productName}" onerror="this.parentElement.innerHTML='<div class=\\'community-product-emoji\\'>${product.emoji || '📦'}</div>'">`
                : `<div class="community-product-emoji">${product.emoji || '📦'}</div>`;

            return `
                <div class="community-product-card" onclick="viewCommunityProduct('${product.id}')">
                    ${badge}
                    <div class="community-product-image">
                        ${imageContent}
                    </div>
                    <div class="community-product-info">
                        <div class="community-seller">
                            ${product.sellerPictureUrl
                    ? `<img src="${product.sellerPictureUrl}" class="comm-seller-avatar-mini" alt="Seller">`
                    : `<i class="fas fa-store-alt"></i>`}
                            <span>${product.sellerName || 'ผู้ขาย'}</span>
                            ${product.isOTOP ? '<span class="community-seller-badge"><i class="fas fa-check-circle"></i> OTOP</span>' : ''}
                        </div>
                        <h3 class="community-product-name">${product.productName}</h3>
                        <div class="community-product-rating">
                            <span class="community-stars">${stars}</span>
                            <span class="community-rating-count">(${product.rating || 0})</span>
                            <span class="community-views" style="margin-left:auto; font-size:0.7rem; color:rgba(255,255,255,0.4);">
                                <i class="fas fa-eye"></i> ${product.views || 0}
                            </span>
                        </div>
                        <div class="community-product-tags">${tags}</div>
                        <div class="community-product-price-row">
                            <div class="price-wrap">
                                <span class="community-product-price">฿${formatPrice(product.price)}</span>
                                <span class="community-price-unit">/${product.unit || 'ชิ้น'}</span>
                            </div>
                            <div class="community-product-actions">
                                <button class="community-btn-save" id="saveCommProduct-${product.id}" onclick="event.stopPropagation(); toggleSaveMarketItem('${product.id}', 'community_product')" title="บันทึก">
                                    <i class="far fa-bookmark"></i>
                                </button>
                                <button class="community-btn-add" onclick="event.stopPropagation(); addToCart('${product.id}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // View community product - FULL FEATURED
        let currentCommProduct = null;

        function viewCommunityProduct(productId) {
            const product = allCommunityProducts.find(p => p.id === productId);
            if (!product) {
                showToast('ไม่พบสินค้า', 'error');
                return;
            }

            currentCommProduct = product;

            // Populate Modal
            document.getElementById('commModalMainImage').src = product.imageUrl || 'https://placehold.co/400x400?text=No+Image';
            document.getElementById('commModalTitle').textContent = product.productName || 'ไม่ระบุชื่อ';
            document.getElementById('commModalPrice').textContent = `฿${formatPrice(product.price)}`;
            document.getElementById('commModalUnit').textContent = `/${product.unit || 'ชิ้น'}`;
            document.getElementById('commModalDesc').textContent = product.description || 'ไม่มีรายละเอียดเพิ่มเติม';
            document.getElementById('commModalSellerName').textContent = product.sellerName || 'ผู้ขาย';

            const commSellerAvatar = document.getElementById('commModalSellerAvatar');
            if (product.sellerPictureUrl) {
                commSellerAvatar.innerHTML = `<img src="${product.sellerPictureUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                commSellerAvatar.textContent = '👨‍🌾';
            }

            document.getElementById('commModalLocation').textContent = product.location || product.province || 'ไม่ระบุ';

            // Stock status
            const stockEl = document.getElementById('commModalStock');
            if (product.stock > 0) {
                stockEl.innerHTML = `<i class="fas fa-box"></i> เหลือ ${product.stock} ${product.unit || 'ชิ้น'}`;
                stockEl.style.background = 'rgba(74,222,128,0.2)';
                stockEl.style.color = '#4ade80';
            } else {
                stockEl.innerHTML = `<i class="fas fa-times-circle"></i> สินค้าหมด`;
                stockEl.style.background = 'rgba(248,113,113,0.2)';
                stockEl.style.color = '#f87171';
            }

            // Rating
            const rating = product.rating || 0;
            const reviews = product.reviews || 0;
            const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
            document.getElementById('commModalStars').textContent = stars;
            document.getElementById('commModalRatingText').textContent = `${rating.toFixed(1)} (${reviews} รีวิว)`;
            document.getElementById('commModalSold').textContent = `ขายแล้ว ${product.soldCount || 0} ชิ้น`;

            // Badge
            const badge = document.getElementById('commModalBadge');
            if (product.isOTOP) {
                badge.textContent = 'OTOP';
                badge.style.display = 'block';
            } else if (product.isOrganic) {
                badge.textContent = 'อินทรีย์';
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }

            // Tags
            const tagsContainer = document.getElementById('commModalTags');
            let tagsHtml = '';
            if (product.isOrganic) tagsHtml += '<span class="comm-tag organic">🌿 อินทรีย์</span>';
            if (product.isOTOP) tagsHtml += '<span class="comm-tag otop">🎁 OTOP</span>';
            if (product.category) tagsHtml += `<span class="comm-tag">${product.category}</span>`;
            (product.tags || []).forEach(tag => {
                tagsHtml += `<span class="comm-tag">${tag}</span>`;
            });
            tagsContainer.innerHTML = tagsHtml;

            // Thumbnails (if multiple images)
            const thumbContainer = document.getElementById('commModalThumbnails');
            const images = product.images || [product.imageUrl].filter(Boolean);
            if (images.length > 1) {
                thumbContainer.innerHTML = images.map((img, i) => `
                    <img src="${img}" alt="Thumb ${i + 1}" class="${i === 0 ? 'active' : ''}" 
                         onclick="setCommMainImage('${img}', this)">
                `).join('');
            } else {
                thumbContainer.innerHTML = '';
            }

            // Reset quantity
            document.getElementById('commQtyInput').value = 1;

            // Load related products
            loadCommRelatedProducts(product.category, product.id);

            // Show Modal
            document.getElementById('commProductModal').classList.add('show');
            document.body.style.overflow = 'hidden';

            // Track view
            trackCommProductView(productId);

            // Update Save Button in Modal
            const modalSaveBtn = document.getElementById('saveModalCommProduct');
            if (modalSaveBtn) {
                const isSaved = userSavedItems.some(i => i.id === productId);
                modalSaveBtn.classList.toggle('active', isSaved);
                const icon = modalSaveBtn.querySelector('i');
                if (icon) icon.className = isSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
            }
        }

        function closeCommProductModal(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('commProductModal').classList.remove('show');
            document.body.style.overflow = 'auto';
        }

        function setCommMainImage(src, thumbEl) {
            document.getElementById('commModalMainImage').src = src;
            document.querySelectorAll('.comm-thumbnail-row img').forEach(img => img.classList.remove('active'));
            if (thumbEl) thumbEl.classList.add('active');
        }

        function adjustCommQty(delta) {
            const input = document.getElementById('commQtyInput');
            let val = parseInt(input.value) || 1;
            val = Math.max(1, Math.min(99, val + delta));
            input.value = val;
        }

        function addCommToCart() {
            if (!currentCommProduct) return;
            const qty = parseInt(document.getElementById('commQtyInput').value) || 1;

            // Add to cart (you can implement full cart logic here)
            const cartBadge = document.getElementById('cartCountBadge');
            if (cartBadge) {
                const current = parseInt(cartBadge.textContent) || 0;
                cartBadge.textContent = current + qty;
            }

            showToast(`🛒 เพิ่ม "${currentCommProduct.productName}" x${qty} ลงตะกร้าแล้ว!`, 'success');
        }

        function contactCommSeller() {
            if (!currentCommProduct) return;

            const lineOA = currentCommProduct.lineId || currentCommProduct.lineOA || 'https://lin.ee/1YJsw47';
            const message = encodeURIComponent(`สนใจสินค้า: ${currentCommProduct.productName}\nราคา: ฿${formatPrice(currentCommProduct.price)}/${currentCommProduct.unit || 'ชิ้น'}\nจาก: ${currentCommProduct.sellerName || 'ผู้ขาย'}`);

            let url = '';
            if (lineOA.startsWith('http')) {
                url = lineOA;
            } else {
                url = `https://line.me/R/ti/p/${lineOA}`;
            }

            if (url) {
                const win = window.open(url, '_blank');
                if (!win) {
                    window.location.href = url;
                }
                showToast('กำลังเปิด LINE เพื่อติดต่อผู้ขาย...', 'info');
            }
        }

        function contactCommMessenger() {
            if (!currentCommProduct) return;

            // Get Messenger link from product data
            const messengerUrl = currentCommProduct.messenger || currentCommProduct.facebookMessenger || currentCommProduct.facebook;

            let url = '';
            if (messengerUrl) {
                // Open direct Messenger link from product
                url = messengerUrl;
                if (!url.startsWith('http')) {
                    url = `https://m.me/${messengerUrl}`;
                }
            } else {
                // Fallback: open Facebook page messenger
                const fbPageId = '100063904268221'; // Default WiT page
                const message = encodeURIComponent(`สนใจสินค้า: ${currentCommProduct.productName}\nราคา: ฿${formatPrice(currentCommProduct.price)}/${currentCommProduct.unit || 'ชิ้น'}`);
                url = `https://m.me/${fbPageId}?text=${message}`;
            }

            if (url) {
                const win = window.open(url, '_blank');
                if (!win) {
                    window.location.href = url;
                }
                showToast('กำลังเปิด Messenger...', 'info');
            }
        }

        function shareCommProduct(platform) {
            if (!currentCommProduct) return;

            const url = `${window.location.origin}/marketplace?product=${currentCommProduct.id}`;
            const text = `${currentCommProduct.productName} - ฿${formatPrice(currentCommProduct.price)} | ตลาดเกษตรชุมชน`;

            let shareUrl = '';
            switch (platform) {
                case 'line':
                    shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
                    break;
                case 'copy':
                    navigator.clipboard.writeText(url).then(() => {
                        showToast('📋 คัดลอกลิงก์แล้ว!', 'success');
                    });
                    return;
            }

            if (shareUrl) {
                const win = window.open(shareUrl, '_blank');
                if (!win) {
                    window.location.href = shareUrl;
                }
            }
        }

        function followSeller() {
            showToast('❤️ ติดตามผู้ขายแล้ว!', 'success');
            document.querySelector('.comm-follow-btn').innerHTML = '<i class="fas fa-heart" style="color:#f87171;"></i>';
        }

        function loadCommRelatedProducts(category, excludeId) {
            const container = document.getElementById('commRelatedProducts');

            // Filter related products (same category, exclude current)
            const related = allCommunityProducts
                .filter(p => p.id !== excludeId && (p.category === category || p.isOTOP))
                .slice(0, 4);

            if (related.length === 0) {
                container.innerHTML = '<p style="color:rgba(255,255,255,0.5);grid-column:1/-1;text-align:center;">ไม่มีสินค้าที่คล้ายกัน</p>';
                return;
            }

            container.innerHTML = related.map(p => `
                <div class="comm-related-card" onclick="viewCommunityProduct('${p.id}')">
                    <img src="${p.imageUrl || 'https://placehold.co/150?text=No+Image'}" alt="${p.productName}" 
                         onerror="this.onerror=null; this.src='https://placehold.co/150?text=No+Image'">
                    <div class="info">
                        <div class="name">${p.productName}</div>
                        <div class="price">฿${formatPrice(p.price)}/${p.unit || 'ชิ้น'}</div>
                    </div>
                </div>
            `).join('');
        }

        async function trackCommProductView(productId) {
            try {
                await db.collection('community_products').doc(productId).update({
                    views: firebase.firestore.FieldValue.increment(1)
                });
            } catch (e) {
                console.log('Track view failed:', e);
            }
        }

        // Limit Add to Cart frequency
        let lastAddToCart = 0;
        function addToCart(productId) {
            const now = Date.now();
            if (now - lastAddToCart < 1000) return; // Debounce 1s
            lastAddToCart = now;

            const cartBadge = document.getElementById('cartCountBadge');
            if (cartBadge) {
                const current = parseInt(cartBadge.textContent) || 0;
                cartBadge.textContent = current + 1;

                // Animate badge
                cartBadge.classList.add('pulse-badge');
                setTimeout(() => cartBadge.classList.remove('pulse-badge'), 500);
            }
            showToast('🛒 เพิ่มลงตะกร้าแล้ว!', 'success');
        }


    </script>


    <!-- Admin Ads FAB -->
    <button class="admin-ads-fab" id="adminAdsFab" onclick="openAdminAdsModal()" title="จัดการโฆษณา">
        <i class="fas fa-bullhorn"></i>
    </button>

    <!-- Seller Invite FAB -->
    <button class="seller-invite-fab" onclick="openSellerInviteModal()">
        <i class="fas fa-store-alt"></i>
        <span>สนใจลงขาย</span>
    </button>

    <style>
        /* Admin Ads FAB */
        .admin-ads-fab {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 999;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .admin-ads-fab.show {
            display: flex;
            animation: fabBounceIn 0.5s;
        }

        .admin-ads-fab:hover {
            transform: scale(1.1) rotate(10deg);
            box-shadow: 0 8px 25px rgba(247, 147, 30, 0.4);
        }

        @keyframes fabBounceIn {
            0% {
                transform: scale(0);
                opacity: 0;
            }

            60% {
                transform: scale(1.15);
                opacity: 1;
            }

            100% {
                transform: scale(1);
            }
        }

        /* Seller Invite FAB */
        .seller-invite-fab {
            position: fixed;
            bottom: 30px;
            left: 30px;
            padding: 12px 24px;
            border-radius: 50px;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 10px 25px rgba(236, 72, 153, 0.4);
            z-index: 998;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            animation: fabBounceIn 0.5s 1s both, pulseInvite 2s infinite;
        }

        .seller-invite-fab:hover {
            transform: scale(1.05) translateY(-5px);
            box-shadow: 0 15px 30px rgba(236, 72, 153, 0.5);
        }

        .seller-invite-fab i {
            font-size: 1.2rem;
        }

        @keyframes pulseInvite {
            0% {
                box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4);
            }

            70% {
                box-shadow: 0 0 0 15px rgba(236, 72, 153, 0);
            }

            100% {
                box-shadow: 0 0 0 0 rgba(236, 72, 153, 0);
            }
        }

        /* Seller Invite Modal Styles */
        .seller-invite-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10002;
            padding: 20px;
            backdrop-filter: blur(15px);
            justify-content: center;
            align-items: center;
            overflow-y: auto;
        }

        .seller-invite-overlay.show {
            display: flex;
        }

        .seller-invite-container {
            background: #0f172a;
            width: 100%;
            max-width: 900px;
            border-radius: 30px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .invite-hero {
            padding: 40px;
            background: linear-gradient(135deg, #1e1b4b, #312e81);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .invite-hero::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at top right, rgba(236, 72, 153, 0.2), transparent);
        }

        .invite-hero h2 {
            font-size: 2.2rem;
            font-weight: 800;
            margin-bottom: 10px;
            color: white;
        }

        .invite-hero p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 1.1rem;
        }

        .invite-grid {
            padding: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }

        @media (max-width: 768px) {
            .invite-grid {
                grid-template-columns: 1fr;
            }
        }

        .wow-feature {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .wow-feature h3 {
            color: #f472b6;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .feature-item {
            margin-bottom: 15px;
            display: flex;
            gap: 15px;
        }

        .feature-icon {
            color: #818cf8;
            font-size: 1.2rem;
        }

        .feature-text h4 {
            font-size: 1rem;
            color: white;
            margin-bottom: 5px;
        }

        .feature-text p {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .pricing-section {
            background: rgba(255, 255, 255, 0.02);
            padding: 40px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
        }

        @media (max-width: 600px) {
            .pricing-grid {
                grid-template-columns: 1fr;
            }
        }

        .price-card {
            background: #1e293b;
            padding: 25px;
            border-radius: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s;
        }

        .price-card.featured {
            border-color: #ec4899;
            transform: scale(1.05);
            background: #1e1b4b;
        }

        .price-card h4 {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
        }

        .price-card .amount {
            font-size: 2rem;
            font-weight: 800;
            color: white;
            margin: 10px 0;
        }

        .price-card .sub {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.4);
        }

        .price-card ul {
            list-style: none;
            padding: 0;
            margin: 20px 0;
            text-align: left;
        }

        .price-card li {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
            display: flex;
            gap: 8px;
        }

        .price-card li i {
            color: #10b981;
        }

        .start-steps {
            padding: 40px;
            text-align: center;
        }

        .steps-row {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            position: relative;
        }

        .steps-row::after {
            content: '';
            position: absolute;
            top: 25px;
            left: 10%;
            right: 10%;
            height: 2px;
            background: rgba(255, 255, 255, 0.1);
            z-index: 0;
        }

        .step-item {
            position: relative;
            z-index: 1;
            width: 30%;
        }

        .step-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #334155;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-weight: 800;
            border: 4px solid #0f172a;
        }

        .step-item.active .step-circle {
            background: #6366f1;
        }

        .step-item p {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
        }

        .invite-footer {
            padding: 30px;
            display: flex;
            gap: 20px;
            justify-content: center;
            background: rgba(0, 0, 0, 0.2);
        }

        .btn-invite-primary {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-invite-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-invite-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);
        }

        /* Load More Button Styles */
        .btn-load-more {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 12px 40px;
            border-radius: 30px;
            font-weight: 600;
            transition: all 0.3s;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }

        .btn-load-more:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
            border-color: #6366f1;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .spinner-sm {
            width: 25px;
            height: 25px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        /* ========================================
           PREMIUM MODERN FOOTER
           ======================================== */
        .premium-footer {
            background: linear-gradient(to bottom, transparent, #0f172a 100px);
            padding: 80px 0 40px;
            color: white;
            position: relative;
            z-index: 100;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            margin-top: 60px;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1.5fr;
            gap: 40px;
            max-width: 1300px;
            margin: 0 auto;
            padding: 0 30px;
        }

        @media (max-width: 992px) {
            .footer-grid {
                grid-template-columns: 1fr 1fr;
                gap: 50px 30px;
            }
        }

        @media (max-width: 600px) {
            .footer-grid {
                grid-template-columns: 1fr;
                text-align: center;
            }
        }

        .footer-brand h4 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(90deg, var(--primary), var(--accent));
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        @media (max-width: 600px) {
            .footer-brand h4 {
                justify-content: center;
            }
        }

        .footer-brand p {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 25px;
            max-width: 320px;
        }

        @media (max-width: 600px) {
            .footer-brand p {
                margin-left: auto;
                margin-right: auto;
            }
        }

        .social-links-footer {
            display: flex;
            gap: 12px;
        }

        @media (max-width: 600px) {
            .social-links-footer {
                justify-content: center;
            }
        }

        .social-icon-btn {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .social-icon-btn:hover {
            transform: translateY(-5px);
            background: rgba(112, 225, 255, 0.15);
            border-color: #70e1ff;
            color: #70e1ff;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .footer-col h5 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            color: white;
            margin-bottom: 25px;
            position: relative;
            padding-bottom: 10px;
        }

        .footer-col h5::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 30px;
            height: 2px;
            background: var(--primary-gradient);
        }

        @media (max-width: 600px) {
            .footer-col h5::after {
                left: 50%;
                transform: translateX(-50%);
            }
        }

        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .footer-links li {
            margin-bottom: 12px;
        }

        .footer-links a {
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            font-size: 0.95rem;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        @media (max-width: 600px) {
            .footer-links a {
                justify-content: center;
            }
        }

        .footer-links a i {
            font-size: 0.7rem;
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.3s;
        }

        .footer-links a:hover {
            color: #70e1ff;
            transform: translateX(5px);
        }

        @media (max-width: 600px) {
            .footer-links a:hover {
                transform: translateX(0) scale(1.05);
            }
        }

        .footer-links a:hover i {
            opacity: 1;
            transform: translateX(0);
        }

        .sell-with-us-box {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 20px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .line-add-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: linear-gradient(135deg, #00B900, #009900);
            color: white;
            padding: 12px 20px;
            border-radius: 15px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.95rem;
            margin-top: 15px;
            transition: all 0.3s;
            box-shadow: 0 10px 20px rgba(0, 185, 0, 0.2);
            border: none;
        }

        .line-add-btn:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 15px 30px rgba(0, 185, 0, 0.3);
            color: white;
        }

        .footer-bottom {
            max-width: 1300px;
            margin: 60px auto 0;
            padding: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: rgba(255, 255, 255, 0.4);
            font-size: 0.85rem;
        }

        @media (max-width: 600px) {
            .footer-bottom {
                flex-direction: column;
                gap: 15px;
                text-align: center;
                margin-top: 40px;
                padding-bottom: 120px;
                /* Space for mobile nav */
            }
        }

        .footer-bottom-links {
            display: flex;
            gap: 20px;
        }

        .footer-bottom-links a {
            color: rgba(255, 255, 255, 0.4);
            text-decoration: none;
        }

        .footer-bottom-links a:hover {
            color: white;
        }
    </style>
    <!-- Guide Modal -->
    <div class="guide-modal-overlay" id="guideModal" onclick="closeGuide()">
        <div class="guide-modal-container" onclick="event.stopPropagation()">
            <div class="guide-header">
                <h3><i class="fas fa-info-circle"></i> ช่วยเหลือ & วิธีใช้งาน</h3>
                <button class="guide-close-btn" onclick="closeGuide()">&times;</button>
            </div>
            <div class="guide-tabs">
                <div class="guide-tab active" onclick="switchGuideTab('buy')">วิธีซื้อสินค้า</div>
                <div class="guide-tab" onclick="switchGuideTab('sell')">วิธีลงขายสินค้า</div>
                <div class="guide-tab" onclick="switchGuideTab('faq')">คำถามพบบ่อย</div>
            </div>
            <div class="guide-body">
                <!-- How to Buy -->
                <div class="guide-section active" id="guide-buy">
                    <div class="guide-step">
                        <div class="step-num">1</div>
                        <div class="step-content">
                            <h4>ค้นหาสินค้าที่ต้องการ</h4>
                            <p>เลือกรับชมสินค้าจากหมวดหมู่ หรือใช้ระบบค้นหาอัจฉริยะเพื่อหาสินค้าที่คุณสนใจทันที</p>
                        </div>
                    </div>
                    <div class="guide-step">
                        <div class="step-num">2</div>
                        <div class="step-content">
                            <h4>เช็กรายละเอียดสินค้า</h4>
                            <p>คลิกที่สินค้าเพื่อดูรูปภาพเพิ่มเติม ราคา และข้อมูลผู้ขาย</p>
                        </div>
                    </div>
                    <div class="guide-step">
                        <div class="step-num">3</div>
                        <div class="step-content">
                            <h4>ติดต่อหรือขอซื้อสินค้า</h4>
                            <p>คุณสามารถกดปุ่ม <strong>"ขอซื้อสินค้า"</strong> เพื่อเริ่มการสั่งซื้อทันที
                                หรือเลือกช่องทาง <strong>LINE / Messenger</strong> เพื่อพูดคุยรายละเอียดกับผู้ขายโดยตรง
                            </p>
                        </div>
                    </div>
                    <div class="guide-step">
                        <div class="step-num">4</div>
                        <div class="step-content">
                            <h4>ตกลงและรับสินค้า</h4>
                            <p>พูดคุยเรื่องวิธีจัดส่งและชำระเงินกับผู้ขาย
                                (แนะนำระบบเก็บเงินปลายทางเพื่อความปลอดภัยสูงสุด)</p>
                        </div>
                    </div>
                </div>

                <!-- How to Sell -->
                <div class="guide-section" id="guide-sell">
                    <div class="guide-step">
                        <div class="step-num">1</div>
                        <div class="step-content">
                            <h4>เพิ่มเพื่อน LINE OA</h4>
                            <p>กดปุ่ม "ลงขาย" ในหน้าเว็บ หรือสแกนเพิ่มเพื่อนได้ที่ <strong>@wizmobiz</strong>
                                เพื่อยืนยันตัวตน</p>
                        </div>
                    </div>
                    <div class="guide-step">
                        <div class="step-num">2</div>
                        <div class="step-content">
                            <h4>ขอรหัสผ่าน (PIN)</h4>
                            <p>เข้าแชท LINE แล้วพิมพ์ <strong>"ขอรหัสผ่าน"</strong> ระบบจะส่งรหัส 6 หลักมาให้ (ใช้ได้ 1
                                ครั้งใน 5 นาที)</p>
                        </div>
                    </div>
                    <div class="guide-step">
                        <div class="step-num">3</div>
                        <div class="step-content">
                            <h4>เข้าสู่ระบบบนเว็บ</h4>
                            <p>นำรหัสที่ได้มากรอกในหน้า Marketplace เพื่อปลดล็อกระบบลงขายอัจฉริยะ</p>
                        </div>
                    </div>
                    <div class="guide-step">
                        <div class="step-num">4</div>
                        <div class="step-content">
                            <h4>ลงขายด้วยตัวช่วย AI</h4>
                            <p>เลือกรูปภาพสินค้าที่ต้องการขาย AI ของเราจะช่วยคิดหัวข้อ คำบรรยาย
                                และเลือกหมวดหมู่ให้โดยอัตโนมัติ!</p>
                        </div>
                    </div>
                    <div class="guide-step">
                        <div class="step-num">5</div>
                        <div class="step-content">
                            <h4>เข้าระบบร้านของฉัน (My Store)</h4>
                            <p>ยกระดับการขายด้วยระบบร้านค้ามืออาชีพ เลือกแพ็กเกจที่รองรับธุรกิจของคุณ:
                                <strong>99.-</strong> / <strong>259.-</strong> / <strong>699.-</strong>
                                เพื่อเข้าถึงระบบจัดการสต็อกและสถิติร้านค้าขั้นสูง
                            </p>
                        </div>
                    </div>
                </div>

                <!-- FAQ -->
                <div class="guide-section" id="guide-faq">
                    <div class="faq-item">
                        <span class="faq-q">Q: ลงขายสินค้าที่นี่เสียเงินไหม?</span>
                        <div class="faq-a">A: <strong>ไม่มีค่าใช้จ่าย!</strong> สมาชิก TukTuk Ecosystem
                            สามารถลงขายสินค้าได้ฟรีทันที เพื่อสนับสนุนเศรษฐกิจชุมชน</div>
                    </div>
                    <div class="faq-item">
                        <span class="faq-q">Q: ทำไมต้องขอ PIN จาก LINE ก่อนลงขาย?</span>
                        <div class="faq-a">A: เพื่อคัดกรองผู้ขายจริงและลดปัญหาผู้ขายปลอม (Scam) โดยระบบจะทำการ Binding
                            อุปกรณ์ของคุณกับบัญชี LINE ที่มีตัวตนจริง</div>
                    </div>
                    <div class="faq-item">
                        <span class="faq-q">Q: รหัส PIN ขอใหม่ได้ไหมถ้าหมดอายุ?</span>
                        <div class="faq-a">A: ได้ครับ สามารถพิมพ์ "ขอรหัสผ่าน" ใน LINE เพื่อรับรหัสใหม่ได้ตลอดเวลา</div>
                    </div>
                    <div class="faq-item">
                        <span class="faq-q">Q: ติดต่อทีมงานช่วยเหลือได้อย่างไร?</span>
                        <div class="faq-a">A: สามารถพิมพ์ <strong>"ติดต่อเจ้าหน้าที่"</strong> ในหน้า LINE OA
                            ของเราได้ทันที จะมีทีมงานคอยบริการครับ</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // ========================================
        // QUICK VIEW FUNCTIONS
        // ========================================

        // Guide Functions
        function openGuide(tab = 'buy') {
            document.getElementById('guideModal').classList.add('show');
            document.body.style.overflow = 'hidden';
            switchGuideTab(tab);
        }
        function closeGuide() {
            document.getElementById('guideModal').classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        function switchGuideTab(tabId) {
            // Tabs
            const tabs = document.querySelectorAll('.guide-tab');
            tabs.forEach(t => t.classList.remove('active'));

            // Content
            document.querySelectorAll('.guide-section').forEach(s => s.classList.remove('active'));

            if (tabId === 'buy') {
                tabs[0].classList.add('active');
                document.getElementById('guide-buy').classList.add('active');
            } else if (tabId === 'sell') {
                tabs[1].classList.add('active');
                document.getElementById('guide-sell').classList.add('active');
            } else {
                tabs[2].classList.add('active');
                document.getElementById('guide-faq').classList.add('active');
            }
        }

        // Request to Buy - Enhanced Contact
        function requestToBuy(isCommunity) {
            let product = isCommunity ? currentCommProduct : currentViewProduct;
            if (!product) return;

            const text = `🛒 ขอซื้อสินค้า: ${product.productName || product.title}\n💰 ราคา: ฿${formatPrice(product.price)}\n📍 จาก: ${window.location.origin}/marketplace?product=${product.id}`;

            // Log analytics
            if (window.tuktukTrackEvent) {
                window.tuktukTrackEvent('request_buy_click', {
                    productId: product.id,
                    type: isCommunity ? 'community' : 'secondhand'
                });
            }

            // Priority: Line ID -> Messenger -> Phone -> Default Line OA
            const lineId = product.lineId || product.lineOA;
            const messenger = product.messenger || product.facebook;

            if (lineId) {
                const url = lineId.startsWith('http') ? lineId : `https://line.me/R/ti/p/${lineId}`;
                window.open(url, '_blank');
            } else if (messenger) {
                const url = messenger.startsWith('http') ? messenger : `https://m.me/${messenger}`;
                window.open(url, '_blank');
            } else {
                // Fallback to default LINE OA with pre-filled message
                const lineOA = 'https://lin.ee/1YJsw47';
                window.open(`${lineOA}?text=${encodeURIComponent(text)}`, '_blank');
            }

            showToast('กำลังเปิดช่องทางติดต่อเพื่อสั่งซื้อ...', 'info');
        }

        // Seller Invite Modal Functions
        function openSellerInviteModal() {
            document.getElementById('sellerInviteModal').classList.add('show');
            document.body.style.overflow = 'hidden';
            if (window.tuktukTrackEvent) window.tuktukTrackEvent('seller_invite_view');
        }
        function closeSellerInviteModal() {
            document.getElementById('sellerInviteModal').classList.remove('show');
            document.body.style.overflow = 'auto';
        }

        // Smart Search Overlay Logic
        function toggleSearchOverlay() {
            const overlay = document.getElementById('smartSearchOverlay');
            if (overlay.style.display === 'flex') {
                overlay.classList.remove('show');
                setTimeout(() => overlay.style.display = 'none', 300);
                document.body.style.overflow = 'auto';
            } else {
                overlay.style.display = 'flex';
                setTimeout(() => {
                    overlay.classList.add('show');
                    document.getElementById('smartSearchInput').focus();
                }, 10);
                document.body.style.overflow = 'hidden';
            }
        }

        function executeSmartSearch() {
            const query = document.getElementById('smartSearchInput').value.trim();
            if (!query) return;

            // Re-use existing search logic
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = query;
                toggleSearchOverlay();
                // Trigger existing search
                handleSearch();
            }
        }

        function quickFilter(term) {
            const searchInput = document.getElementById('smartSearchInput');
            searchInput.value = term;
            executeSmartSearch();
        }

        // ==========================================
        // MARKETPLACE HUB LOGIC
        // ==========================================
        function handleTukTukButtonClick() {
            if (!WizmobizAuth.isLoggedIn()) {
                showToast('กรุณาเข้าสู่ระบบเพื่อใช้งานส่วนนี้', 'warning');
                setTimeout(() => WizmobizAuth.redirectToLogin(), 1500);
                return;
            }

            const overlay = document.getElementById('marketHubOverlay');
            const btn = document.getElementById('centerBtn');
            const nav = document.getElementById('bottomNav');
            const isShowing = overlay.classList.contains('show');

            if (isShowing) {
                closeMarketHub();
            } else {
                overlay.style.display = 'flex';
                setTimeout(() => {
                    overlay.classList.add('show');
                    btn.classList.add('active');
                    if (nav) nav.classList.add('overlay-active');
                }, 10);
                document.body.style.overflow = 'hidden';
            }
        }

        function closeMarketHub() {
            const overlay = document.getElementById('marketHubOverlay');
            const btn = document.getElementById('centerBtn');
            const nav = document.getElementById('bottomNav');
            overlay.classList.remove('show');
            btn.classList.remove('active');
            if (nav) nav.classList.remove('overlay-active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
            document.body.style.overflow = 'auto';
        }

        function quickMarketAction(action) {
            closeMarketHub();
            if (action === 'sell') {
                WizmobizAuth.handleShopAccess('post-product.html');
            }