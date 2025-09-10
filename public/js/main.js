// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    initializeToasts();
    updateNavigation();
    
    // Also update navigation after a short delay to ensure all elements are loaded
    setTimeout(() => {
        updateNavigation();
    }, 100);
    
    // Set up periodic navigation updates to ensure consistency
    setInterval(() => {
        updateNavigation();
    }, 2000); // Update every 2 seconds
});

// Update navigation when the page becomes visible (e.g., when switching tabs)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updateNavigation();
    }
});

// Update navigation when the window gains focus
window.addEventListener('focus', function() {
    updateNavigation();
});

// Update navigation based on login status
function updateNavigation() {
    const isLoggedIn = !!localStorage.getItem('userToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // console.log('Updating navigation - Is logged in:', isLoggedIn, 'User:', user);
    
    // Get navigation elements
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutLink = document.getElementById('logout-link');
    const adminLink = document.getElementById('admin-link');
    const userName = document.getElementById('user-name');
    
    //  console.log('Elements found:', {
    //     loginLink: !!loginLink,
    //     registerLink: !!registerLink,
    //     userDropdown: !!userDropdown,
    //     userName: !!userName
    // });
    
    if (isLoggedIn) {
        // Hide login/register links
        if (loginLink) {
            loginLink.style.display = 'none';
            // console.log('Hidden login link');
        }
        if (registerLink) {
            registerLink.style.display = 'none';
            // console.log('Hidden register link');
        }
        
        // Show user dropdown
        if (userDropdown) {
            userDropdown.style.display = 'block';
            // console.log('Showed user dropdown');
            if (userName) {
                userName.textContent = user.name || user.email || 'User';
                // console.log('Set user name to:', userName.textContent);
            }
        }
        
        // Hide the fallback logout link when dropdown is available
        if (logoutLink) {
            logoutLink.style.display = userDropdown ? 'none' : 'block';
        }
        
        // Show admin link only for admin users
        if (adminLink) {
            adminLink.style.display = (user.isAdmin) ? 'block' : 'none';
        }
    } else {
        // console.log('User not logged in, showing login/register links');
        // Show login/register links
        if (loginLink) {
            loginLink.style.display = 'block';
            // console.log('Showed login link');
        }
        if (registerLink) {
            registerLink.style.display = 'block';
            // console.log('Showed register link');
        }
        
        // Hide user dropdown and logout link
        if (userDropdown) {
            userDropdown.style.display = 'none';
            // console.log('Hidden user dropdown');
        }
        if (logoutLink) logoutLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Cart Management Functions
function addToCart(productId, quantity = 1) {
    // console.log('=== ADD TO CART DEBUG ===');
    // console.log('addToCart called with:', productId, quantity);
    // console.log('Current cart:', cart);
    
    // Check user status
    const token = localStorage.getItem('userToken');
    if (!token) {
        showToast('Please login to add items to your cart.', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
        return;
    }

    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += parseInt(quantity);
    } else {
        const newItem = {
            productId: productId,
            quantity: parseInt(quantity)
        };
        cart.push(newItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Product added to cart!', 'success');
}

function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    // console.log('updateCartCount - Cart count:', cartCount);
    
    const countElement = document.getElementById('cart-count');
    // console.log('updateCartCount - Count element found:', !!countElement);
    
    if (countElement) {
        countElement.textContent = cartCount;
        // console.log('updateCartCount - Updated cart count display to:', cartCount);
    } else {
        // console.log('updateCartCount - Cart count element not found');
    }
}

function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Toast Notification System
function initializeToasts() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// API Helper Functions
async function apiRequest(url, options = {}) {
    try {
        const token = localStorage.getItem('userToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios({
            url: url,
            method: options.method || 'GET',
            headers: headers,
            data: options.data
        });
        
        return response.data;
    } catch (error) {
        console.error('API Request Error:', error);
        if (error.response) {
            throw new Error(error.response.data.message || 'Request failed');
        } else {
            throw new Error('Network error occurred');
        }
    }
}

// Authentication Functions
function isLoggedIn() {
    return !!localStorage.getItem('userToken');
}

function logout() {
    // console.log('logout() function called');
    // console.log('Before logout - userToken:', localStorage.getItem('userToken'));
    // console.log('Before logout - user:', localStorage.getItem('user'));
    
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    // console.log('LocalStorage items removed');
    
    clearCart();
    // console.log('Cart cleared');
    
    showToast('Logged out successfully', 'success');
    // console.log('Toast shown');
    
    updateNavigation();
    // console.log('Navigation updated');
    
    // console.log('Redirecting to home page...');
    window.location.href = '/';
}

function requireAuth() {
    if (!isLoggedIn()) {
        showToast('Please login to continue', 'error');
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Form Validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateForm(formData, rules) {
    const errors = [];
    
    for (const field in rules) {
        const value = formData[field];
        const rule = rules[field];
        
        if (rule.required && (!value || value.trim() === '')) {
            errors.push(`${field} is required`);
            continue;
        }
        
        if (rule.email && value && !validateEmail(value)) {
            errors.push(`Please enter a valid email address`);
        }
        
        if (rule.minLength && value && value.length < rule.minLength) {
            errors.push(`${field} must be at least ${rule.minLength} characters long`);
        }
        
        if (rule.maxLength && value && value.length > rule.maxLength) {
            errors.push(`${field} must be no more than ${rule.maxLength} characters long`);
        }
    }
    
    return errors;
}

// Utility Functions
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Loading States
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Local Storage Helpers
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// Image Handling
function handleImageError(img) {
    img.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
    img.onerror = null; // Prevent infinite loop
}

function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Search Functionality
const searchProducts = debounce(async function(query) {
    if (!query.trim()) return;
    
    try {
        const response = await apiRequest(`/api/v1/products?search=${encodeURIComponent(query)}`);
        // Handle search results
        // console.log('Search results:', response);
    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed. Please try again.', 'error');
    }
}, 300);

// Navigation Helpers
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/';
    }
}

function redirectWithDelay(url, delay = 2000) {
    setTimeout(() => {
        window.location.href = url;
    }, delay);
}

// Error Handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Export functions for use in other scripts
window.ecommerceApp = {
    addToCart,
    updateCartCount,
    clearCart,
    showToast,
    apiRequest,
    isLoggedIn,
    logout,
    requireAuth,
    validateForm,
    formatPrice,
    formatDate,
    searchProducts,
    goBack,
    handleImageError
};

// Make key functions available globally for onclick handlers
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.showToast = showToast;
window.updateNavigation = updateNavigation;
window.logout = logout;

// Test function for debugging
window.testAddToCart = function() {
    // console.log('Testing addToCart function...');
    addToCart('test-product-id', 1);
};

// Debug function to check if main.js is loaded
window.mainJsLoaded = true;
// console.log('main.js has been loaded successfully');
// console.log('addToCart function available:', typeof addToCart);
// console.log('window.addToCart available:', typeof window.addToCart);
