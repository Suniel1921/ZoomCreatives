import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure axios is imported
import { useAuthGlobally } from '../../context/AuthContext';

const ClientPayment = () => {
  const [paymentData, setPaymentData] = useState<any>(null); // State to store payment data
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [auth] = useAuthGlobally(); // Access user authentication data from context

  // Fetch payment data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_URL}/api/v1/appointment/getAllModelDataByID/${auth.user.id}`
        );

        // Extract all model data without filtering completed tasks
        const allData = response.data.allData;
        const allTasks = Object.keys(allData).flatMap(modelName =>
          allData[modelName].map(task => ({ ...task, modelName }))
        );

        setPaymentData(allTasks); // Set all tasks without filtering
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMessage =
          err.response?.data?.message || 'Failed to fetch data. Please try again later.';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchData();
  }, [auth.user.id]); // Add auth.user.id as a dependency to refetch data when user ID changes

  if (loading) {
    return <div>Loading...</div>; // Display loading text while fetching data
  }

  if (error) {
    return <div>{error}</div>; // Display error message if fetching fails
  }

  return (
    <div>
      <h2>Client Payment Section</h2>

      {/* Display the payment data */}
      {paymentData && paymentData.length > 0 ? (
        <div className="space-y-4">
          {paymentData.map((task: any) => (
            <div key={task._id} className="bg-white rounded-lg p-4">
              {/* Display model name with the word "Model" removed */}
              <h4 className="font-medium">
                {task.modelName.replace('Model', '')} {/* Remove the word "Model" */}
              </h4>
              <p className="text-sm text-gray-500">Amount: {task.amount}</p>
              <p className="text-sm text-gray-500">Payment Method: {task.paymentMethod}</p>
              <p className="text-sm text-gray-500">Payment Status: {task.paymentStatus}</p>
              <p className="text-sm text-gray-500">Due Amount: {task.dueAmount}</p>
              <p className="text-sm text-gray-500">Paid Amount: {task.paidAmount}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No payment data available.</p> // Message when there's no payment data
      )}
    </div>
  );
};

export default ClientPayment;
