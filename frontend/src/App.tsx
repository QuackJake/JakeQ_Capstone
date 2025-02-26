import React from 'react';
import DocumentList from './DocumentList';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-4xl p-4">
        <DocumentList />
      </div>
    </div>
  );
};

export default App;
