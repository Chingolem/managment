import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth, WORKSPACE_CONFIGS } from '../hooks/useAuth.jsx';

export default function SetupForm({ onCreate }) {
  const [name, setName] = useState('');
  const [total] = useState(1);
  const [defaultPrice, setDefaultPrice] = useState(10);
  const { t } = useLanguage();
  const { user } = useAuth();

  const config = WORKSPACE_CONFIGS[user?.role || 'video_editor'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && total > 0) {
      onCreate({ name, total, defaultPrice });
    }
  };

  return (
    <div className="setup-card">
      <h2>{t('createNewProject')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('clientNameLabel')}</label>
          <input 
            type="text" 
            className="input-field" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder={t('clientNamePlaceholder')} 
            required 
          />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ width: '100%' }}>
            <label>{t('defaultPriceLabel')}</label>
            <input 
              type="number" 
              className="input-field" 
              value={defaultPrice} 
              onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)} 
              min="0" 
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
          <Plus size={20} /> {t('createWorkspace')}
        </button>
      </form>
    </div>
  );
}