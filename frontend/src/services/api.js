const API_BASE = '';

export const roomApi = {
  list: async () => {
    const res = await fetch(`${API_BASE}/api/rooms`);
    return res.json();
  },
  
  get: async (roomId) => {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}`);
    if (!res.ok) throw new Error('房间不存在');
    return res.json();
  },
  
  create: async (data) => {
    const res = await fetch(`${API_BASE}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  vote: async (roomId, optionId, voterIdentifier) => {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option_id: optionId, voter_identifier: voterIdentifier })
    });
    return res.json();
  },
  
  getQRCode: async (roomId) => {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}/qrcode`);
    return res.json();
  },
  
  toggle: async (roomId, isActive) => {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive })
    });
    return res.json();
  }
};
