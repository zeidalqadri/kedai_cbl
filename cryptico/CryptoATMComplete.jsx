import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================
const CONFIG = {
  // Telegram Bot Setup (Get from @BotFather)
  telegramBotToken: 'YOUR_BOT_TOKEN_HERE',
  telegramChatId: 'YOUR_CHAT_ID_HERE',
  
  // Business Info
  businessName: 'CryptoKiosk',
  businessTagline: 'Buy crypto instantly with DuitNow',
  supportTelegram: '@cryptokiosk_support',
  supportEmail: 'support@cryptokiosk.my',
  
  // Your DuitNow QR Code (base64 or URL)
  duitNowQrImage: null, // Replace with your QR
  
  // Transaction Limits (MYR)
  minAmount: 50,
  maxAmount: 10000,
  
  // Fees
  networkFees: {
    'TRC-20': 1.00,
    'BEP-20': 2.50,
    'ERC-20': 15.00,
    'POLYGON': 0.50,
  },
  
  // Rate markup (percentage added to market rate)
  rateMarkup: 0.02, // 2%
  
  // Rate lock duration (seconds)
  rateLockDuration: 300, // 5 minutes
  
  // Admin password (in production, use proper auth)
  adminPassword: 'admin123',
};

// ============================================================================
// CRYPTO ASSETS & NETWORKS
// ============================================================================
const CRYPTO_ASSETS = {
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    icon: '💵',
    color: '#26A17B',
    coingeckoId: 'tether',
    networks: ['TRC-20', 'BEP-20', 'ERC-20', 'POLYGON'],
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: '🔵',
    color: '#2775CA',
    coingeckoId: 'usd-coin',
    networks: ['TRC-20', 'BEP-20', 'ERC-20', 'POLYGON'],
  },
  BNB: {
    name: 'BNB',
    symbol: 'BNB',
    icon: '🟡',
    color: '#F3BA2F',
    coingeckoId: 'binancecoin',
    networks: ['BEP-20'],
  },
  MATIC: {
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '🟣',
    color: '#8247E5',
    coingeckoId: 'matic-network',
    networks: ['POLYGON', 'ERC-20'],
  },
};

const NETWORKS = {
  'TRC-20': {
    name: 'Tron (TRC-20)',
    icon: '🔴',
    addressPrefix: 'T',
    addressLength: 34,
    explorer: 'https://tronscan.org/#/address/',
    confirmations: '~1 min',
  },
  'BEP-20': {
    name: 'BNB Smart Chain (BEP-20)',
    icon: '🟡',
    addressPrefix: '0x',
    addressLength: 42,
    explorer: 'https://bscscan.com/address/',
    confirmations: '~15 sec',
  },
  'ERC-20': {
    name: 'Ethereum (ERC-20)',
    icon: '💎',
    addressPrefix: '0x',
    addressLength: 42,
    explorer: 'https://etherscan.io/address/',
    confirmations: '~2 min',
  },
  'POLYGON': {
    name: 'Polygon',
    icon: '🟣',
    addressPrefix: '0x',
    addressLength: 42,
    explorer: 'https://polygonscan.com/address/',
    confirmations: '~5 sec',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatMYR = (amount) => `RM ${Number(amount).toFixed(2)}`;
const formatCrypto = (amount, decimals = 6) => Number(amount).toFixed(decimals);
const generateOrderId = () => `CK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
const formatDate = (timestamp) => new Date(timestamp).toLocaleString('en-MY', { 
  dateStyle: 'medium', 
  timeStyle: 'short' 
});

const validateWalletAddress = (address, network) => {
  const config = NETWORKS[network];
  if (!config) return { valid: false, error: 'Invalid network' };
  
  if (config.addressPrefix === 'T') {
    if (!address.startsWith('T')) return { valid: false, error: 'TRC-20 address must start with T' };
    if (address.length !== 34) return { valid: false, error: 'TRC-20 address must be 34 characters' };
  } else if (config.addressPrefix === '0x') {
    if (!address.startsWith('0x')) return { valid: false, error: `${network} address must start with 0x` };
    if (address.length !== 42) return { valid: false, error: `${network} address must be 42 characters` };
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return { valid: false, error: 'Invalid address format' };
  }
  
  return { valid: true };
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================
const STORAGE_KEYS = {
  ORDERS: 'cryptoatm:orders',
  SETTINGS: 'cryptoatm:settings',
  STATS: 'cryptoatm:stats',
};

const storage = {
  async getOrders() {
    try {
      const result = await window.storage.get(STORAGE_KEYS.ORDERS);
      return result ? JSON.parse(result.value) : [];
    } catch {
      return [];
    }
  },
  
  async saveOrders(orders) {
    try {
      await window.storage.set(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      return true;
    } catch {
      return false;
    }
  },
  
  async addOrder(order) {
    const orders = await this.getOrders();
    orders.unshift(order);
    // Keep last 1000 orders
    if (orders.length > 1000) orders.length = 1000;
    return await this.saveOrders(orders);
  },
  
  async updateOrder(orderId, updates) {
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates, updatedAt: Date.now() };
      await this.saveOrders(orders);
      return orders[index];
    }
    return null;
  },
  
  async getOrder(orderId) {
    const orders = await this.getOrders();
    return orders.find(o => o.id === orderId) || null;
  },
};

// ============================================================================
// TELEGRAM API
// ============================================================================
const telegram = {
  async sendMessage(message, replyMarkup = null) {
    if (CONFIG.telegramBotToken === 'YOUR_BOT_TOKEN_HERE') {
      console.log('📱 Telegram (demo):', message);
      return { ok: true, demo: true };
    }
    
    try {
      const payload = {
        chat_id: CONFIG.telegramChatId,
        text: message,
        parse_mode: 'HTML',
      };
      if (replyMarkup) payload.reply_markup = JSON.stringify(replyMarkup);
      
      const response = await fetch(
        `https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Telegram error:', error);
      return { ok: false, error };
    }
  },
  
  async sendPhoto(photoBase64, caption) {
    if (CONFIG.telegramBotToken === 'YOUR_BOT_TOKEN_HERE') {
      console.log('📷 Telegram photo (demo):', caption);
      return { ok: true, demo: true };
    }
    
    try {
      const formData = new FormData();
      const blob = await fetch(photoBase64).then(r => r.blob());
      formData.append('chat_id', CONFIG.telegramChatId);
      formData.append('photo', blob, 'payment_proof.jpg');
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      
      const response = await fetch(
        `https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendPhoto`,
        { method: 'POST', body: formData }
      );
      return await response.json();
    } catch (error) {
      console.error('Telegram photo error:', error);
      return { ok: false, error };
    }
  },
  
  formatOrderNotification(order) {
    return `
🔔 <b>NEW CRYPTO ORDER</b>

📋 <b>Order ID:</b> <code>${order.id}</code>
💰 <b>Amount Paid:</b> ${formatMYR(order.amountMYR)}
🪙 <b>Crypto:</b> ${formatCrypto(order.amountCrypto, 4)} ${order.crypto}
📍 <b>Network:</b> ${order.network}
💸 <b>Network Fee:</b> ${formatMYR(order.networkFee)}

👤 <b>Customer:</b>
├ Name: ${order.customer.name}
├ ${order.customer.contactType === 'telegram' ? 'Telegram' : 'Email'}: ${order.customer.contact}
└ Wallet: <code>${order.customer.walletAddress}</code>

💳 <b>Payment Ref:</b> ${order.paymentRef || 'Screenshot attached'}
📅 <b>Time:</b> ${formatDate(order.createdAt)}

⏳ <b>Status:</b> Awaiting verification
`.trim();
  },
  
  formatStatusUpdate(order, status, txHash = null) {
    const statusEmoji = {
      approved: '✅',
      rejected: '❌',
      processing: '⏳',
      completed: '🎉',
    };
    
    let message = `
${statusEmoji[status] || '📋'} <b>ORDER ${status.toUpperCase()}</b>

📋 Order: <code>${order.id}</code>
👤 Customer: ${order.customer.name}
🪙 Amount: ${formatCrypto(order.amountCrypto, 4)} ${order.crypto}
`.trim();

    if (txHash) {
      const explorer = NETWORKS[order.network]?.explorer || '';
      message += `\n\n🔗 <b>TX Hash:</b> <a href="${explorer}${txHash}">${txHash.slice(0, 16)}...</a>`;
    }
    
    return message;
  }
};

// ============================================================================
// PRICE FETCHING
// ============================================================================
const fetchPrices = async () => {
  try {
    const ids = Object.values(CRYPTO_ASSETS).map(a => a.coingeckoId).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=myr`
    );
    const data = await response.json();
    
    const prices = {};
    Object.entries(CRYPTO_ASSETS).forEach(([symbol, asset]) => {
      const price = data[asset.coingeckoId]?.myr;
      // Apply markup
      prices[symbol] = price ? price * (1 + CONFIG.rateMarkup) : null;
    });
    
    return prices;
  } catch {
    // Fallback rates (with markup applied)
    return {
      USDT: 4.55,
      USDC: 4.55,
      BNB: 2850,
      MATIC: 2.20,
    };
  }
};

// ============================================================================
// ICONS
// ============================================================================
const Icons = {
  Back: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Check: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  ExternalLink: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

// ============================================================================
// MAIN APPLICATION
// ============================================================================
export default function CryptoATMComplete() {
  const [mode, setMode] = useState('kiosk'); // 'kiosk' or 'admin'
  const [adminAuth, setAdminAuth] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-950">
      {mode === 'kiosk' ? (
        <KioskMode onAdminAccess={() => setMode('admin')} />
      ) : (
        <AdminMode 
          isAuthenticated={adminAuth}
          onAuthenticate={setAdminAuth}
          onExit={() => { setMode('kiosk'); setAdminAuth(false); }}
        />
      )}
    </div>
  );
}

// ============================================================================
// KIOSK MODE
// ============================================================================
function KioskMode({ onAdminAccess }) {
  const [screen, setScreen] = useState('welcome');
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [amount, setAmount] = useState('');
  const [prices, setPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [rateLockTime, setRateLockTime] = useState(null);
  const [userDetails, setUserDetails] = useState({
    name: '',
    contactType: 'telegram',
    contact: '',
    walletAddress: '',
  });
  const [orderId, setOrderId] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState('');
  const [lookupOrderId, setLookupOrderId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  
  // Admin access via long press
  const [adminPressStart, setAdminPressStart] = useState(null);
  
  // Fetch prices
  useEffect(() => {
    const loadPrices = async () => {
      setPricesLoading(true);
      const p = await fetchPrices();
      setPrices(p);
      setPricesLoading(false);
    };
    loadPrices();
    const interval = setInterval(loadPrices, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Rate lock countdown
  useEffect(() => {
    if (!rateLockTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, rateLockTime - Date.now());
      if (remaining === 0) {
        setRateLockTime(null);
        if (screen !== 'welcome' && screen !== 'lookup') {
          setError('Rate lock expired. Please restart.');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLockTime, screen]);
  
  const networkFee = selectedNetwork ? CONFIG.networkFees[selectedNetwork] || 0 : 0;
  const cryptoAmount = selectedCrypto && amount && prices[selectedCrypto]
    ? (parseFloat(amount) - networkFee) / prices[selectedCrypto]
    : 0;
  
  const rateLockRemaining = rateLockTime ? Math.max(0, Math.floor((rateLockTime - Date.now()) / 1000)) : 0;
  
  const resetFlow = () => {
    setScreen('welcome');
    setSelectedCrypto(null);
    setSelectedNetwork(null);
    setAmount('');
    setUserDetails({ name: '', contactType: 'telegram', contact: '', walletAddress: '' });
    setOrderId('');
    setCurrentOrder(null);
    setPaymentProof(null);
    setPaymentRef('');
    setError('');
    setRateLockTime(null);
  };
  
  const selectCrypto = (crypto) => {
    setSelectedCrypto(crypto);
    const networks = CRYPTO_ASSETS[crypto].networks;
    if (networks.length === 1) {
      setSelectedNetwork(networks[0]);
      setScreen('amount');
    } else {
      setScreen('network');
    }
  };
  
  const selectNetwork = (network) => {
    setSelectedNetwork(network);
    setScreen('amount');
  };
  
  const submitAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < CONFIG.minAmount) {
      setError(`Minimum amount is ${formatMYR(CONFIG.minAmount)}`);
      return;
    }
    if (numAmount > CONFIG.maxAmount) {
      setError(`Maximum amount is ${formatMYR(CONFIG.maxAmount)}`);
      return;
    }
    if (numAmount <= networkFee) {
      setError(`Amount must be greater than network fee (${formatMYR(networkFee)})`);
      return;
    }
    setError('');
    // Lock the rate
    setRateLockTime(Date.now() + CONFIG.rateLockDuration * 1000);
    setScreen('details');
  };
  
  const submitDetails = () => {
    if (!userDetails.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!userDetails.contact.trim()) {
      setError('Please enter your contact');
      return;
    }
    if (!userDetails.walletAddress.trim()) {
      setError('Please enter your wallet address');
      return;
    }
    
    const validation = validateWalletAddress(userDetails.walletAddress, selectedNetwork);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    setError('');
    const newOrderId = generateOrderId();
    setOrderId(newOrderId);
    setScreen('payment');
  };
  
  const submitPaymentProof = async () => {
    if (!paymentRef.trim() && !paymentProof) {
      setError('Please provide payment reference or upload screenshot');
      return;
    }
    setError('');
    
    // Create order
    const order = {
      id: orderId,
      crypto: selectedCrypto,
      network: selectedNetwork,
      amountMYR: parseFloat(amount),
      amountCrypto: cryptoAmount,
      networkFee: networkFee,
      rate: prices[selectedCrypto],
      customer: { ...userDetails },
      paymentRef: paymentRef,
      hasProofImage: !!paymentProof,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setCurrentOrder(order);
    
    // Save to storage
    await storage.addOrder(order);
    
    // Send Telegram notification
    const message = telegram.formatOrderNotification(order);
    await telegram.sendMessage(message);
    
    if (paymentProof) {
      await telegram.sendPhoto(paymentProof, `📋 Payment proof for order ${orderId}`);
    }
    
    setScreen('processing');
  };
  
  const lookupOrder = async () => {
    if (!lookupOrderId.trim()) {
      setError('Please enter an order ID');
      return;
    }
    setError('');
    setLookupLoading(true);
    
    const order = await storage.getOrder(lookupOrderId.trim().toUpperCase());
    setLookupResult(order);
    setLookupLoading(false);
    
    if (!order) {
      setError('Order not found');
    }
  };
  
  // Handle long press for admin access
  const handleLogoPress = () => setAdminPressStart(Date.now());
  const handleLogoRelease = () => {
    if (adminPressStart && Date.now() - adminPressStart > 3000) {
      onAdminAccess();
    }
    setAdminPressStart(null);
  };
  
  const quickAmounts = [100, 200, 500, 1000, 2000];
  
  // ========== SCREENS ==========
  
  const WelcomeScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div 
          className="text-center mb-10 cursor-pointer select-none"
          onMouseDown={handleLogoPress}
          onMouseUp={handleLogoRelease}
          onMouseLeave={() => setAdminPressStart(null)}
          onTouchStart={handleLogoPress}
          onTouchEnd={handleLogoRelease}
        >
          <div className="text-6xl mb-4">🏧</div>
          <h1 className="text-3xl font-bold text-white mb-2">{CONFIG.businessName}</h1>
          <p className="text-gray-400">{CONFIG.businessTagline}</p>
        </div>
        
        <div className="w-full max-w-sm space-y-3">
          <p className="text-center text-gray-400 text-sm mb-4">Select cryptocurrency to buy</p>
          
          {pricesLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading rates...</p>
            </div>
          ) : (
            Object.entries(CRYPTO_ASSETS).map(([key, asset]) => (
              <button
                key={key}
                onClick={() => selectCrypto(key)}
                className="w-full p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  borderColor: `${asset.color}50`,
                  background: `linear-gradient(135deg, ${asset.color}10, transparent)`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{asset.icon}</span>
                    <div className="text-left">
                      <div className="text-white font-bold">{asset.symbol}</div>
                      <div className="text-gray-500 text-sm">{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">{prices[key] ? formatMYR(prices[key]) : '—'}</div>
                    <div className="text-gray-600 text-xs">{asset.networks.length} networks</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      <div className="px-6 pb-6">
        <button
          onClick={() => setScreen('lookup')}
          className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm"
        >
          🔍 Track Existing Order
        </button>
      </div>
    </div>
  );
  
  const NetworkScreen = () => (
    <div className="flex flex-col h-full px-6 py-8">
      <button onClick={() => setScreen('welcome')} className="flex items-center gap-2 text-gray-400 mb-6 self-start hover:text-white transition-colors">
        <Icons.Back /> Back
      </button>
      
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ backgroundColor: `${CRYPTO_ASSETS[selectedCrypto].color}20` }}>
          <span>{CRYPTO_ASSETS[selectedCrypto].icon}</span>
          <span className="text-white font-medium">{selectedCrypto}</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Select Network</h2>
        <p className="text-gray-400 text-sm mt-1">Choose blockchain network for receiving</p>
      </div>
      
      <div className="flex-1">
        <div className="space-y-3 max-w-sm mx-auto">
          {CRYPTO_ASSETS[selectedCrypto].networks.map(network => (
            <button
              key={network}
              onClick={() => selectNetwork(network)}
              className="w-full p-5 rounded-2xl border-2 border-gray-700 hover:border-gray-600 bg-gray-800/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{NETWORKS[network].icon}</span>
                  <div className="text-left">
                    <div className="text-white font-medium">{network}</div>
                    <div className="text-gray-500 text-sm">{NETWORKS[network].name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">{formatMYR(CONFIG.networkFees[network])}</div>
                  <div className="text-gray-600 text-xs">network fee</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <p className="text-center text-gray-600 text-xs mt-6 max-w-sm mx-auto">
          Lower fees = longer confirmation. Choose based on your preference.
        </p>
      </div>
    </div>
  );
  
  const AmountScreen = () => (
    <div className="flex flex-col h-full px-6 py-8">
      <button onClick={() => CRYPTO_ASSETS[selectedCrypto].networks.length > 1 ? setScreen('network') : setScreen('welcome')} 
        className="flex items-center gap-2 text-gray-400 mb-6 self-start hover:text-white transition-colors">
        <Icons.Back /> Back
      </button>
      
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
          style={{ backgroundColor: `${CRYPTO_ASSETS[selectedCrypto].color}20` }}>
          <span>{CRYPTO_ASSETS[selectedCrypto].icon}</span>
          <span className="text-white font-medium">{selectedCrypto}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400 text-sm">{selectedNetwork}</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Enter Amount</h2>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-sm">
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-medium">RM</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder="0.00"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl px-4 pl-14 py-5 text-white text-2xl font-mono text-center focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {quickAmounts.map(qa => (
              <button
                key={qa}
                onClick={() => setAmount(qa.toString())}
                className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                {qa}
              </button>
            ))}
          </div>

          {amount && parseFloat(amount) > networkFee && (
            <div className="bg-gray-800/50 rounded-2xl p-4 mb-4 border border-gray-700">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>You pay</span>
                  <span className="text-white">{formatMYR(amount)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Network fee ({selectedNetwork})</span>
                  <span>-{formatMYR(networkFee)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Rate</span>
                  <span>1 {selectedCrypto} = {formatMYR(prices[selectedCrypto])}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">You receive</span>
                    <span className="font-mono font-bold text-lg" style={{ color: CRYPTO_ASSETS[selectedCrypto].color }}>
                      {formatCrypto(cryptoAmount, 4)} {selectedCrypto}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={submitAmount}
            disabled={!amount || parseFloat(amount) <= networkFee}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: CRYPTO_ASSETS[selectedCrypto].color, color: 'white' }}
          >
            Continue
          </button>

          <p className="text-center text-gray-500 text-xs mt-4">
            Min: {formatMYR(CONFIG.minAmount)} • Max: {formatMYR(CONFIG.maxAmount)}
          </p>
        </div>
      </div>
    </div>
  );
  
  const DetailsScreen = () => (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setScreen('amount')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <Icons.Back /> Back
        </button>
        {rateLockTime && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
            <span>⏱</span>
            <span>Rate locked: {Math.floor(rateLockRemaining / 60)}:{(rateLockRemaining % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Your Details</h2>
        <p className="text-gray-400 text-sm mt-1">We'll contact you for verification</p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Full Name *</label>
            <input
              type="text"
              value={userDetails.name}
              onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
              placeholder="Ahmad bin Abdullah"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Contact Method *</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => setUserDetails({ ...userDetails, contactType: 'telegram', contact: '' })}
                className={`py-3 rounded-xl font-medium transition-colors ${
                  userDetails.contactType === 'telegram' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                📱 Telegram
              </button>
              <button
                onClick={() => setUserDetails({ ...userDetails, contactType: 'email', contact: '' })}
                className={`py-3 rounded-xl font-medium transition-colors ${
                  userDetails.contactType === 'email' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ✉️ Email
              </button>
            </div>
            <input
              type={userDetails.contactType === 'email' ? 'email' : 'text'}
              value={userDetails.contact}
              onChange={(e) => setUserDetails({ ...userDetails, contact: e.target.value })}
              placeholder={userDetails.contactType === 'telegram' ? '@your_username' : 'you@email.com'}
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              {selectedCrypto} Wallet Address ({selectedNetwork}) *
            </label>
            <textarea
              value={userDetails.walletAddress}
              onChange={(e) => setUserDetails({ ...userDetails, walletAddress: e.target.value.trim() })}
              placeholder={NETWORKS[selectedNetwork].addressPrefix + '...'}
              rows={2}
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${
                validateWalletAddress(userDetails.walletAddress, selectedNetwork).valid 
                  ? 'bg-green-500' 
                  : userDetails.walletAddress ? 'bg-red-500' : 'bg-gray-600'
              }`}></span>
              <span className="text-gray-500 text-xs">
                {NETWORKS[selectedNetwork].name} address
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">{formatMYR(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">You receive</span>
                <span className="font-mono" style={{ color: CRYPTO_ASSETS[selectedCrypto].color }}>
                  {formatCrypto(cryptoAmount, 4)} {selectedCrypto}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={submitDetails}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: CRYPTO_ASSETS[selectedCrypto].color, color: 'white' }}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
  
  const PaymentScreen = () => (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setScreen('details')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <Icons.Back /> Back
        </button>
        {rateLockTime && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
            <span>⏱</span>
            <span>{Math.floor(rateLockRemaining / 60)}:{(rateLockRemaining % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>

      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">Scan to Pay</h2>
        <p className="text-gray-400 text-sm mt-1">Order #{orderId}</p>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-auto">
        <div className="w-full max-w-sm">
          {/* QR Code */}
          <div className="bg-white rounded-3xl p-5 mb-4">
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {CONFIG.duitNowQrImage ? (
                <img src={CONFIG.duitNowQrImage} alt="DuitNow QR" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-4">
                  <div className="text-5xl mb-3">📱</div>
                  <p className="text-gray-600 font-medium">DuitNow QR</p>
                  <p className="text-gray-400 text-xs mt-1">Configure your QR code</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-gray-800">{formatMYR(amount)}</div>
              <p className="text-gray-500 text-sm mt-1">Scan with any Malaysian banking app</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Buying</span>
                <span className="text-white font-mono">{formatCrypto(cryptoAmount, 4)} {selectedCrypto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">{selectedNetwork}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">To</span>
                <span className="text-white font-mono text-xs">{userDetails.walletAddress.slice(0, 10)}...{userDetails.walletAddress.slice(-8)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setScreen('confirm')}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: CRYPTO_ASSETS[selectedCrypto].color, color: 'white' }}
          >
            I've Made Payment ✓
          </button>
        </div>
      </div>
    </div>
  );
  
  const ConfirmScreen = () => {
    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setError('File too large. Max 5MB.');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setPaymentProof(reader.result);
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setScreen('payment')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <Icons.Back /> Back
          </button>
          {rateLockTime && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
              <span>⏱</span>
              <span>{Math.floor(rateLockRemaining / 60)}:{(rateLockRemaining % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Confirm Payment</h2>
          <p className="text-gray-400 text-sm mt-1">Help us verify your payment</p>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="w-full max-w-sm mx-auto space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Payment Reference / Transaction ID</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g., 2025011512345678"
                className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              <p className="text-gray-600 text-xs mt-1">Found in your banking app's transaction history</p>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 border-t border-gray-700"></div>
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t border-gray-700"></div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Upload Payment Screenshot</label>
              <label className="block w-full cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  paymentProof ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-gray-600'
                }`}>
                  {paymentProof ? (
                    <div>
                      <div className="text-green-400 text-3xl mb-2">✓</div>
                      <p className="text-green-400 font-medium">Screenshot uploaded</p>
                      <p className="text-gray-500 text-xs mt-1">Tap to change</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-400 text-3xl mb-2">📎</div>
                      <p className="text-gray-400">Tap to upload screenshot</p>
                      <p className="text-gray-600 text-xs mt-1">Max 5MB, JPG/PNG</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={submitPaymentProof}
              disabled={!paymentRef && !paymentProof}
              className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: CRYPTO_ASSETS[selectedCrypto].color, color: 'white' }}
            >
              Submit for Verification
            </button>

            <p className="text-center text-gray-600 text-xs">
              Your order will be processed within minutes after verification
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  const ProcessingScreen = () => {
    const [polledOrder, setPolledOrder] = useState(null);
    
    // Poll for status updates
    useEffect(() => {
      const poll = async () => {
        const order = await storage.getOrder(orderId);
        if (order && order.status !== 'pending') {
          setPolledOrder(order);
        }
      };
      
      poll();
      const interval = setInterval(poll, 5000);
      return () => clearInterval(interval);
    }, [orderId]);
    
    if (polledOrder && polledOrder.status !== 'pending') {
      return <ResultScreen order={polledOrder} />;
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-8">
        <div className="text-center max-w-sm">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
          <p className="text-gray-400 mb-8">We're checking your payment</p>
          
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 mb-6">
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID</span>
                <span className="text-white font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">{formatMYR(currentOrder?.amountMYR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Crypto</span>
                <span className="font-mono" style={{ color: CRYPTO_ASSETS[selectedCrypto].color }}>
                  {formatCrypto(currentOrder?.amountCrypto, 4)} {selectedCrypto}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">{selectedNetwork}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-gray-500">
              We'll contact you via {userDetails.contactType === 'telegram' ? 'Telegram' : 'email'}
            </p>
            <p className="text-gray-600 text-xs">
              Need help? Contact {CONFIG.supportTelegram}
            </p>
          </div>
          
          <button
            onClick={resetFlow}
            className="mt-8 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            Start New Order
          </button>
        </div>
      </div>
    );
  };
  
  const ResultScreen = ({ order }) => {
    const isApproved = order.status === 'approved' || order.status === 'completed';
    const crypto = CRYPTO_ASSETS[order.crypto];
    
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-8">
        <div className="text-center max-w-sm">
          {isApproved ? (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto"
                style={{ backgroundColor: `${crypto.color}30` }}>
                <span className="text-4xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Confirmed!</h2>
              <p className="text-gray-400 mb-8">
                {order.status === 'completed' ? 'Your crypto has been sent' : 'Processing your crypto transfer'}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center mb-6 mx-auto">
                <span className="text-4xl">✗</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Declined</h2>
              <p className="text-gray-400 mb-8">Please contact support for assistance</p>
            </>
          )}

          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 mb-6 text-left">
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID</span>
                <span className="text-white font-mono">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-white">{formatMYR(order.amountMYR)}</span>
              </div>
              {isApproved && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Crypto {order.status === 'completed' ? 'Sent' : 'Amount'}</span>
                    <span className="font-mono" style={{ color: crypto.color }}>
                      {formatCrypto(order.amountCrypto, 4)} {order.crypto}
                    </span>
                  </div>
                  {order.txHash && (
                    <div className="pt-2 border-t border-gray-700">
                      <span className="text-gray-400 text-xs block mb-1">Transaction Hash</span>
                      <a 
                        href={`${NETWORKS[order.network].explorer}${order.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-xs font-mono break-all hover:underline flex items-center gap-1"
                      >
                        {order.txHash.slice(0, 20)}...{order.txHash.slice(-10)}
                        <Icons.ExternalLink />
                      </a>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-gray-400 text-xs block mb-1">To Wallet</span>
                    <span className="text-white font-mono text-xs break-all">{order.customer.walletAddress}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            onClick={resetFlow}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            Done
          </button>

          <p className="text-gray-600 text-xs mt-4">
            Questions? Contact {CONFIG.supportTelegram}
          </p>
        </div>
      </div>
    );
  };
  
  const LookupScreen = () => (
    <div className="flex flex-col h-full px-6 py-8">
      <button onClick={() => { setScreen('welcome'); setLookupResult(null); setLookupOrderId(''); setError(''); }} 
        className="flex items-center gap-2 text-gray-400 mb-6 self-start hover:text-white transition-colors">
        <Icons.Back /> Back
      </button>

      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-2xl font-bold text-white">Track Order</h2>
        <p className="text-gray-400 text-sm mt-1">Enter your order ID to check status</p>
      </div>

      <div className="flex-1">
        <div className="w-full max-w-sm mx-auto">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={lookupOrderId}
              onChange={(e) => { setLookupOrderId(e.target.value.toUpperCase()); setError(''); setLookupResult(null); }}
              placeholder="e.g., CKL4NXYZ"
              className="flex-1 bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white font-mono uppercase focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button
              onClick={lookupOrder}
              disabled={lookupLoading}
              className="px-5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
            >
              {lookupLoading ? '...' : 'Search'}
            </button>
          </div>

          {error && !lookupResult && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
              {error}
            </div>
          )}

          {lookupResult && (
            <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-mono font-bold">{lookupResult.id}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  lookupResult.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  lookupResult.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                  lookupResult.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {lookupResult.status.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white">{formatMYR(lookupResult.amountMYR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Crypto</span>
                  <span className="text-white font-mono">
                    {formatCrypto(lookupResult.amountCrypto, 4)} {lookupResult.crypto}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white">{lookupResult.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">{formatDate(lookupResult.createdAt)}</span>
                </div>
                
                {lookupResult.txHash && (
                  <div className="pt-3 border-t border-gray-700">
                    <span className="text-gray-400 text-xs block mb-1">Transaction</span>
                    <a 
                      href={`${NETWORKS[lookupResult.network].explorer}${lookupResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs font-mono hover:underline flex items-center gap-1"
                    >
                      View on explorer <Icons.ExternalLink />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render
  const renderScreen = () => {
    switch (screen) {
      case 'welcome': return <WelcomeScreen />;
      case 'network': return <NetworkScreen />;
      case 'amount': return <AmountScreen />;
      case 'details': return <DetailsScreen />;
      case 'payment': return <PaymentScreen />;
      case 'confirm': return <ConfirmScreen />;
      case 'processing': return <ProcessingScreen />;
      case 'lookup': return <LookupScreen />;
      default: return <WelcomeScreen />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md h-[750px] bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/80">
          <span className="text-gray-500 text-xs font-mono">{CONFIG.businessName}</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-gray-500 text-xs">Live</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN MODE
// ============================================================================
function AdminMode({ isAuthenticated, onAuthenticate, onExit }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = () => {
    if (password === CONFIG.adminPassword) {
      onAuthenticate(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-2xl font-bold text-white">Admin Access</h2>
            <p className="text-gray-400 text-sm mt-1">Enter password to continue</p>
          </div>
          
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white mb-4 focus:border-blue-500 focus:outline-none transition-colors"
          />
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
              {error}
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors mb-4"
          >
            Login
          </button>
          
          <button
            onClick={onExit}
            className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            Back to Kiosk
          </button>
        </div>
      </div>
    );
  }
  
  return <AdminDashboard onExit={onExit} />;
}

function AdminDashboard({ onExit }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [txHash, setTxHash] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const loadOrders = async () => {
    setLoading(true);
    const data = await storage.getOrders();
    setOrders(data);
    setLoading(false);
  };
  
  useEffect(() => {
    loadOrders();
  }, []);
  
  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);
  
  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => o.createdAt >= today);
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      approved: orders.filter(o => o.status === 'approved' || o.status === 'completed').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
      todayCount: todayOrders.length,
      todayVolume: todayOrders.reduce((sum, o) => sum + o.amountMYR, 0),
    };
  }, [orders]);
  
  const handleApprove = async (order) => {
    setActionLoading(true);
    const updated = await storage.updateOrder(order.id, { status: 'approved' });
    if (updated) {
      await telegram.sendMessage(telegram.formatStatusUpdate(updated, 'approved'));
      await loadOrders();
      setSelectedOrder(updated);
    }
    setActionLoading(false);
  };
  
  const handleComplete = async (order) => {
    if (!txHash.trim()) return;
    setActionLoading(true);
    const updated = await storage.updateOrder(order.id, { status: 'completed', txHash: txHash.trim() });
    if (updated) {
      await telegram.sendMessage(telegram.formatStatusUpdate(updated, 'completed', txHash.trim()));
      await loadOrders();
      setSelectedOrder(updated);
      setTxHash('');
    }
    setActionLoading(false);
  };
  
  const handleReject = async (order) => {
    setActionLoading(true);
    const updated = await storage.updateOrder(order.id, { status: 'rejected' });
    if (updated) {
      await telegram.sendMessage(telegram.formatStatusUpdate(updated, 'rejected'));
      await loadOrders();
      setSelectedOrder(updated);
    }
    setActionLoading(false);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🏧</span>
            <div>
              <h1 className="text-xl font-bold">{CONFIG.businessName} Admin</h1>
              <p className="text-gray-500 text-sm">Order Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <Icons.Refresh />
            </button>
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Total Orders</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
            <div className="text-yellow-400 text-sm mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
            <div className="text-green-400 text-sm mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
            <div className="text-blue-400 text-sm mb-1">Today's Volume</div>
            <div className="text-2xl font-bold text-blue-400">{formatMYR(stats.todayVolume)}</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {['all', 'pending', 'approved', 'completed', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && stats.pending > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Orders List */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Order List */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-300 mb-3">Orders ({filteredOrders.length})</h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedOrder?.id === order.id
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-sm font-medium">{order.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{order.customer.name}</span>
                      <span className="font-mono" style={{ color: CRYPTO_ASSETS[order.crypto]?.color }}>
                        {formatCrypto(order.amountCrypto, 2)} {order.crypto}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {formatDate(order.createdAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Order Detail */}
          <div>
            {selectedOrder ? (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Order Details</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Icons.X />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl">{selectedOrder.id}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      selectedOrder.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                      selectedOrder.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {selectedOrder.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Amount Paid</div>
                      <div className="text-white font-medium">{formatMYR(selectedOrder.amountMYR)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Crypto Amount</div>
                      <div className="font-mono" style={{ color: CRYPTO_ASSETS[selectedOrder.crypto]?.color }}>
                        {formatCrypto(selectedOrder.amountCrypto, 6)} {selectedOrder.crypto}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Network</div>
                      <div className="text-white">{selectedOrder.network}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Rate</div>
                      <div className="text-white">{formatMYR(selectedOrder.rate)}</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-gray-500 text-sm mb-2">Customer</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name</span>
                        <span className="text-white">{selectedOrder.customer.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{selectedOrder.customer.contactType}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{selectedOrder.customer.contact}</span>
                          <button
                            onClick={() => copyToClipboard(selectedOrder.customer.contact)}
                            className="text-gray-500 hover:text-white"
                          >
                            <Icons.Copy />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-gray-500 text-sm mb-2">Wallet Address</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-900 p-2 rounded break-all">
                        {selectedOrder.customer.walletAddress}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedOrder.customer.walletAddress)}
                        className="text-gray-500 hover:text-white shrink-0"
                      >
                        <Icons.Copy />
                      </button>
                    </div>
                  </div>
                  
                  {selectedOrder.paymentRef && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-gray-500 text-sm mb-2">Payment Reference</div>
                      <div className="text-white font-mono">{selectedOrder.paymentRef}</div>
                    </div>
                  )}
                  
                  {selectedOrder.txHash && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-gray-500 text-sm mb-2">Transaction Hash</div>
                      <a
                        href={`${NETWORKS[selectedOrder.network]?.explorer}${selectedOrder.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm font-mono hover:underline flex items-center gap-1"
                      >
                        {selectedOrder.txHash.slice(0, 20)}...
                        <Icons.ExternalLink />
                      </a>
                    </div>
                  )}
                  
                  <div className="text-gray-500 text-xs">
                    Created: {formatDate(selectedOrder.createdAt)}
                    {selectedOrder.updatedAt !== selectedOrder.createdAt && (
                      <> • Updated: {formatDate(selectedOrder.updatedAt)}</>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {selectedOrder.status === 'pending' && (
                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleApprove(selectedOrder)}
                          disabled={actionLoading}
                          className="py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(selectedOrder)}
                          disabled={actionLoading}
                          className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.status === 'approved' && (
                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="text-gray-400 text-sm">Mark as completed with TX hash:</div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="Transaction hash..."
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleComplete(selectedOrder)}
                          disabled={actionLoading || !txHash.trim()}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500">Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
