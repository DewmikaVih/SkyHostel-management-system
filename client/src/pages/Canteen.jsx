import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Sun, Coffee, Moon, CheckCircle, Bell, Clock, Apple } from 'lucide-react';
import './Canteen.css';

const Canteen = () => {
  const [tomorrowMenu, setTomorrowMenu] = useState(null);
  const [selections, setSelections] = useState({ breakfast: false, lunch: false, dinner: false });
  const [todayStatus, setTodayStatus] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const todayStr = new Date().toISOString().split('T')[0];

        const [menuRes, statusRes, todayStatusRes, noticeRes] = await Promise.all([
          api.get(`/canteen/menu/${tomorrowStr}`),
          api.get(`/canteen/status/${tomorrowStr}`),
          api.get(`/canteen/status/${todayStr}`),
          api.get('/canteen/notices')
        ]);

        setTomorrowMenu(menuRes.data);
        setSelections(statusRes.data.selections || { breakfast: false, lunch: false, dinner: false });
        setTodayStatus(todayStatusRes.data.consumed || {});
        setNotices(noticeRes.data);
      } catch (err) {
        console.error('Error fetching canteen data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleSelection = (meal) => {
    setSelections({ ...selections, [meal]: !selections[meal] });
  };

  const handleSubmit = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Ensure we use the date part in YYYY-MM-DD format regardless of timezone
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const tomorrowStr = `${year}-${month}-${day}`;

      await api.post('/canteen/select', { date: tomorrowStr, selections });
      alert('Meal selections submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting selections');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="canteen-container">
      <Sidebar role="student" />

      <main className="canteen-main">
        <header className="canteen-header animate-fade-in">
          <div className="header-left">
            <h2>Meals Management</h2>
            <p>Manage your daily meals, view weekly menus, and track nutritional schedules.</p>
          </div>
        </header>

        <div className="canteen-content animate-slide-up">
          <div className="meal-selection-section card">
            <div className="sec-header-flex">
              <div className="sec-header">
                <Coffee size={20} color="#003B46" />
                <h3>Tomorrow's Meal Selection</h3>
              </div>
              <span className="deadline">DEADLINE: 10:00 PM</span>
            </div>

            <div className="meal-options">
              {['breakfast', 'lunch', 'dinner'].map((meal) => {
                const Icon = meal === 'breakfast' ? Sun : (meal === 'lunch' ? Coffee : Moon);
                const mealData = tomorrowMenu?.[meal] || {};
                const isSelected = selections[meal];

                return (
                  <div
                    key={meal}
                    className={`meal-card ${isSelected ? 'selected' : 'opted-out'}`}
                    onClick={() => toggleSelection(meal)}
                  >
                    <div className="m-header">
                      <Icon size={24} />
                      <div className="m-header-right">
                        {!isSelected && <span className="opted-out-badge">OPTED OUT</span>}
                        <div className={`check-box ${isSelected ? 'checked' : ''}`}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                    </div>
                    <h4>{meal.charAt(0).toUpperCase() + meal.slice(1)}</h4>
                    <span className="m-time">{mealData.time || 'TBD'}</span>
                    <div className="menu-list">
                      {mealData.items?.length > 0 ? (
                        <div className="meal-items-flex">
                          {mealData.items.map((item, i) => (
                            <span key={i} className="meal-item-tag">
                              <Apple size={12} className="item-icon" /> {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="no-menu">Menu not set</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="btn-submit-meals" onClick={handleSubmit}>
              <CheckCircle size={18} /> Submit Meal Selection
            </button>
          </div>

          <div className="canteen-sidebar">
            <div className="status-card card">
              <h4>Today's Status</h4>
              <div className="status-list">
                {['breakfast', 'lunch', 'dinner'].map(meal => (
                  <div className="status-row" key={meal}>
                    {todayStatus?.[meal]?.time ? (
                      <>
                        <CheckCircle size={16} color="#00A86B" />
                        <span className="st-name">{meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                        <span className="s-time">Consumed at {new Date(todayStatus[meal].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    ) : (
                      <>
                        <div className="active-dot gray"></div>
                        <span className="st-name">{meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                        <span className="s-active">Not Consumed</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="notices-card card">
              <div className="sec-header">
                <Bell size={18} color="#003B46" />
                <h4>Canteen Notices</h4>
              </div>
              {notices.map(notice => (
                <div key={notice._id} className="c-notice">
                  <Bell size={16} color={notice.priority === 'HIGH' ? '#E63946' : '#718096'} />
                  <div>
                    <strong>{notice.title}</strong>
                    <p>{notice.content}</p>
                  </div>
                </div>
              ))}
              {notices.length === 0 && <p className="no-notices">No recent notices.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Canteen;
