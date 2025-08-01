import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import Header from './components/Header/Header';
import TaskList from './components/TaskList/TaskList';
import TaskForm from './components/TaskForm/TaskForm';
import TaskDetail from './components/TaskDetail/TaskDetail';

function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<TaskList />} />
            <Route path="/create" element={<TaskForm />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/tasks/:id/edit" element={<TaskDetail isEditing={true} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;