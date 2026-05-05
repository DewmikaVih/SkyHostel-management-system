import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Coffee, Sun, Moon, Users, Plus, TrendingUp, Bell } from 'lucide-react';
import './AdminCanteen.css';

const AdminCanteen = () => {
  const [counts, setCounts] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [totalStudents, setTotalStudents] = useState(0);
  const [tomorrowMenu, setTomorrowMenu] = useState({
    breakfast: { items: [], time: '07:30 AM - 09:00 AM' },
    lunch: { items: [], time: '12:30 PM - 02:30 PM' },
    dinner: { items: [], time: '07:30 PM - 09:30 PM' }
  });
  const [notice, setNotice] = useState({ title: '', content: '', priority: 'LOW' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const [countsRes, menuRes, statsRes] = await Promise.all([
          api.get(`/canteen/counts/${tomorrowStr}`),
          api.get(`/canteen/menu/${tomorrowStr}`),
          api.get('/rooms/admin/stats')
        ]);

        setCounts(countsRes.data);
        setTotalStudents(statsRes.data.totalStudents || 0);
        if (menuRes.data._id) setTomorrowMenu(menuRes.data);
      } catch (err) {
        console.error('Error fetching admin canteen data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMenuUpdate = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      await api.post('/canteen/menu', { ...tomorrowMenu, date: tomorrowStr });
      alert('Menu updated successfully!');
    } catch (err) {
      alert('Error updating menu');
    }
  };

  const handleCreateNotice = async () => {
    try {
      await api.post('/canteen/notices', notice);
      alert('Canteen notice published!');
      setNotice({ title: '', content: '', priority: 'LOW' });
    } catch (err) {
      alert('Error publishing notice');
    }
  };

  const mealSummary = [
    { label: 'Breakfast', count: counts.breakfast, total: totalStudents, icon: <Sun size={20} />, color: '#F4A261' },
    { label: 'Lunch', count: counts.lunch, total: totalStudents, icon: <Coffee size={20} />, color: '#00A86B' },
    { label: 'Dinner', count: counts.dinner, total: totalStudents, icon: <Moon size={20} />, color: '#003B46' },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-canteen-container">
      <Sidebar role="admin" />
      
      <main className="admin-main">
        <header className="admin-header animate-fade-in">
          <div className="header-left">
            <h2>Canteen Management</h2>
            <p>Meal forecasting and consumption analytics for tomorrow.</p>
          </div>
        </header>

        <div className="canteen-stats-row animate-fade-in delay-1">
          {mealSummary.map((m, i) => (
            <div key={i} className="c-stat-card card hover-lift">
              <div className="c-stat-header">
                <div className="c-icon" style={{ backgroundColor: `${m.color}15`, color: m.color }}>{m.icon}</div>
                <div className="c-trend"><TrendingUp size={14} /> Forecast</div>
              </div>
              <div className="c-stat-body">
                <span>{m.label} Tomorrow</span>
                <h3>{m.count} <span>/ {m.total}</span></h3>
                <div className="c-progress">
                  <div className="c-progress-bar" style={{ width: `${(m.count/m.total)*100}%`, backgroundColor: m.color }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="canteen-admin-grid animate-slide-up delay-2">
          <div className="menu-management card">
            <div className="sec-header">
              <h3>Tomorrow's Menu Setup</h3>
              <button className="btn-primary-admin" onClick={handleMenuUpdate}>Save Menu</button>
            </div>
            <div className="menu-edit-form">
              {['breakfast', 'lunch', 'dinner'].map(meal => (
                <div className="menu-group" key={meal}>
                  <div className="meal-label-row">
                    <label>{meal.toUpperCase()}</label>
                    <input 
                      type="text" 
                      className="time-input"
                      placeholder="Time range"
                      value={tomorrowMenu[meal].time}
                      onChange={(e) => setTomorrowMenu({
                        ...tomorrowMenu,
                        [meal]: { ...tomorrowMenu[meal], time: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="items-builder">
                    <div className="current-items">
                      {tomorrowMenu[meal].items.map((item, idx) => (
                        <div key={idx} className="item-chip-admin">
                          <span>{item}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              const newItems = [...tomorrowMenu[meal].items];
                              newItems.splice(idx, 1);
                              setTomorrowMenu({
                                ...tomorrowMenu,
                                [meal]: { ...tomorrowMenu[meal], items: newItems }
                              });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="add-item-row">
                      <input 
                        type="text" 
                        id={`add-${meal}`}
                        placeholder="Add new item..." 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val) {
                              setTomorrowMenu({
                                ...tomorrowMenu,
                                [meal]: { ...tomorrowMenu[meal], items: [...tomorrowMenu[meal].items, val] }
                              });
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        className="btn-add-circle"
                        onClick={() => {
                          const input = document.getElementById(`add-${meal}`);
                          const val = input.value.trim();
                          if (val) {
                            setTomorrowMenu({
                              ...tomorrowMenu,
                              [meal]: { ...tomorrowMenu[meal], items: [...tomorrowMenu[meal].items, val] }
                            });
                            input.value = '';
                          }
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="notice-management card">
            <div className="sec-header">
              <h3>Canteen Notice</h3>
              <button className="btn-primary-admin" onClick={handleCreateNotice}>Publish</button>
            </div>
            <div className="notice-form">
              <input 
                type="text" 
                placeholder="Notice Title" 
                value={notice.title}
                onChange={(e) => setNotice({ ...notice, title: e.target.value })}
              />
              <textarea 
                placeholder="Notice Content"
                value={notice.content}
                onChange={(e) => setNotice({ ...notice, content: e.target.value })}
              ></textarea>
              <select 
                value={notice.priority}
                onChange={(e) => setNotice({ ...notice, priority: e.target.value })}
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminCanteen;
