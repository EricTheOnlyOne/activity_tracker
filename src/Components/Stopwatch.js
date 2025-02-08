import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
import TabsButton from './TabsButton';
import ActivitiesList from './ActivitiesList';
import { faUndoAlt, faCirclePlay, faCirclePause } from '@fortawesome/free-solid-svg-icons';

function Stopwatch() {
  const [toggleButtonIcon, setToggleButtonIcon] = useState(faCirclePlay);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [shouldGlow, setShouldGlow] = useState(false);
  const [reference, setReference] = useState('');
  const [activity, setActivity] = useState('');
  const [activities, setActivities] = useState([]);
  const [editingActivityIndex, setEditingActivityIndex] = useState(null); // State for editing activity
  const startTime = useRef(null);
  const prevHours = useRef(0);

  useEffect(() => {
    let animationFrameId;

    const updateTimer = (currentTime) => {
      if (!startTime.current) startTime.current = currentTime;
      const elapsed = currentTime - startTime.current + accumulatedTime;
      setTime(elapsed);
      const totalSeconds = Math.floor(elapsed / 1000);
      const hours = Math.floor(totalSeconds / 3600);

      if (hours !== prevHours.current) {
        prevHours.current = hours;
        setShouldGlow(true);
      }

      if (isActive) {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (isActive) {
      animationFrameId = requestAnimationFrame(updateTimer);
    } else {
      startTime.current = null;
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, accumulatedTime]);

  useEffect(() => {
    if (shouldGlow) {
      const timer = setTimeout(() => setShouldGlow(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldGlow]);

  const toggleWatch = () => {
    if (isActive) {
      setAccumulatedTime(time);
      setIsActive(false);
      setToggleButtonIcon(faCirclePlay);
    } else {
      setIsActive(true);
      setToggleButtonIcon(faCirclePause);
    }
  };

  const reset = () => {
    setTime(0);
    setAccumulatedTime(0);
    setIsActive(false);
    setToggleButtonIcon(faCirclePlay);
  };

  const reassignActivity = (index) => {
    const updatedActivities = activities.map((act, idx) => {
      if (idx === index) {
        return { ...act, isEditing: true };
      }
      return act;
    });

    setActivities(updatedActivities);

    const activityToEdit = activities[index];
    setReference(activityToEdit.reference);
    setActivity(activityToEdit.activity);
    setTime(parseTime(activityToEdit.time));
    setAccumulatedTime(parseTime(activityToEdit.time));
    setEditingActivityIndex(index);
    setIsActive(false);
    setToggleButtonIcon(faCirclePlay);
  };

  const saveActivity = () => {
    const formattedTime = formatTime(time);
    const newActivity = {
      reference,
      activity,
      time: formattedTime,
      createdDate: new Date().toLocaleDateString(),
      isEditing: false,
    };

    if (editingActivityIndex !== null) {
      const updatedActivities = activities.map((act, index) => {
        if (index === editingActivityIndex) {
          const updatedTime = combineTimes(act.time, formattedTime);
          return { ...act, time: updatedTime, isEditing: false };
        }
        return act;
      });
      setActivities(updatedActivities);
      setEditingActivityIndex(null);
    } else {
      setActivities([...activities, newActivity]);
    }

    setReference('');
    setActivity('');
    reset();
  };

  const formatTime = (time) => {
    const milliseconds = Math.floor((time % 1000) / 10);
    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedMilliseconds = milliseconds.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return hours > 0
      ? `${hours}h ${formattedMinutes}m ${formattedSeconds}.${formattedMilliseconds}s`
      : minutes > 0
        ? `${formattedMinutes}m ${formattedSeconds}.${formattedMilliseconds}s`
        : `${formattedSeconds}.${formattedMilliseconds}s`;
  };

  const parseTime = (formattedTime) => {
    const timeParts = formattedTime.split(/[hms]/).map(part => part.trim()).filter(part => part !== '');
    let totalMilliseconds = 0;

    if (timeParts.length === 3) {
      const [hours, minutes, seconds] = timeParts;
      totalMilliseconds = (parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseFloat(seconds)) * 1000;
    } else if (timeParts.length === 2) {
      const [minutes, seconds] = timeParts;
      totalMilliseconds = (parseInt(minutes, 10) * 60 + parseFloat(seconds)) * 1000;
    } else if (timeParts.length === 1) {
      const [seconds] = timeParts;
      totalMilliseconds = parseFloat(seconds) * 1000;
    }

    return totalMilliseconds;
  };

  const combineTimes = (oldTime, newTime) => {
    const oldMilliseconds = parseTime(oldTime);
    const newMilliseconds = parseTime(newTime);
    const totalMilliseconds = oldMilliseconds + newMilliseconds;
    return formatTime(totalMilliseconds);
  };

  return (
    <div className='Stopwatch'>
      <div className='Stopwatch-input-and-controls'>
        <div className="Input-row">
          <input type="text" className="Tabs-input" placeholder="Reference" value={reference} onChange={(e) => setReference(e.target.value)} />
          <input type="text" className="Tabs-input" placeholder="Activity" value={activity} onChange={(e) => setActivity(e.target.value)} />
        </div>
        <div className="Stopwatch-buttons">
          <TabsButton icon={toggleButtonIcon} onClick={toggleWatch} className='icon-button' />
          <TabsButton icon={faUndoAlt} onClick={reset} className='icon-button' />
        </div>
      </div>
      <div className='time-save-container'>
        <h1 className={shouldGlow ? 'glow' : ''} style={{ margin: 0 }}>{formatTime(time)}</h1>
        <TabsButton text='Save' onClick={saveActivity} className='height-fit-content' />
      </div>
      <ActivitiesList activities={activities} onReassign={reassignActivity}></ActivitiesList>
    </div>
  );
}

export default Stopwatch;