window.DroboardSaveAPI = {
    getSaveState: async (storyId) => {
        try {
            const res = await fetch(`/api/save/${storyId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('getSaveState failed:', err);
            return { ok: false, message: err.message };
        }
    },
    toggleQuickSave: async (storyId, key, value) => {
        try {
            const res = await fetch(`/api/save/${storyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('toggleQuickSave failed:', err);
            return { ok: false, message: err.message };
        }
    },
    toggleCollection: async (storyId, collId, value) => {
        try {
            const res = await fetch(`/api/collection/${storyId}/${collId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('toggleCollection failed:', err);
            return { ok: false, message: err.message };
        }
    },
    createCollection: async (storyId, name, icon) => {
        try {
            const res = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storyId, name, icon })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('createCollection failed:', err);
            return { ok: false, message: err.message };
        }
    }
};



// ──────────────────────────────────────────────────────────────────
// SHARE API (for share-modal.js)
// SHARE API (for share-modal.js)
// SHARE API (for share-modal.js)
// ──────────────────────────────────────────────────────────────────




window.DroboardAPI = {
    postToStatus: async (payload) => {
        try {
            const res = await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('postToStatus failed:', err);
            return { ok: false, message: err.message };
        }
    },
    postToProfile: async (payload) => {
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('postToProfile failed:', err);
            return { ok: false, message: err.message };
        }
    }
};