import React, { useState, useEffect } from 'react';
import { Button, Modal, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAccountTaskGlobally } from '../../context/AccountTaskContext';
import { format } from 'date-fns';

const FilesTab = () => {
  const { accountTaskData, selectedClientId } = useAccountTaskGlobally();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Store task ID for which files are being uploaded
  const [selectedModelName, setSelectedModelName] = useState(''); // Store model name dynamically
  console.log('selected model is', selectedModelName)
  const [clientTasks, setClientTasks] = useState({
    applications: [],
    appointment: [],
    documentTranslation: [],
    epassport: [],
    graphicDesigns: [],
    japanVisit: [],
    otherServices: [],
  });

  // Fetch tasks based on clientId
  useEffect(() => {
    if (accountTaskData && selectedClientId) {
      const updatedClientTasks = {
        applications: [],
        appointment: [],
        documentTranslation: [],
        epassport: [],
        graphicDesigns: [],
        japanVisit: [],
        otherServices: [],
      };

      Object.keys(accountTaskData).forEach((key) => {
        const modelData = accountTaskData[key];
        if (Array.isArray(modelData)) {
          modelData.forEach((item) => {
            if (item?.clientId?._id === selectedClientId) {
              if (key === "application") updatedClientTasks.applications.push(item);
              if (key === "appointment") updatedClientTasks.appointment.push(item);
              if (key === "documentTranslation") updatedClientTasks.documentTranslation.push(item);
              if (key === "epassports") updatedClientTasks.epassport.push(item);
              if (key === "graphicDesigns") updatedClientTasks.graphicDesigns.push(item);
              if (key === "japanVisit") updatedClientTasks.japanVisit.push(item);
              if (key === "otherServices") updatedClientTasks.otherServices.push(item);
            }
          });
        }
      });

      setClientTasks(updatedClientTasks);
    }
  }, [selectedClientId, accountTaskData]);

  const renderTaskSection = (title, tasks, modelName) => {
    return (
      tasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-gray-50 p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  {/* Client Name */}
                  <p className="font-medium">{task.clientId.name || task.clientName}</p>

                  {/* Task Status */}
                  <p className="text-sm text-gray-500">
                    Status:{" "}
                    <span className="font-semibold text-blue-500">
                      {task.status || task.visaStatus || task.translationStatus || task.applicationStatus || "Pending"}
                    </span>
                  </p>

                  {/* Deadline */}
                  <p className="text-sm text-gray-500">
                    Deadline:{" "}
                    {task.deadline ? format(new Date(task.deadline), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>

                {/* Upload Button for each task */}
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => handleModalOpen(task._id, modelName)}
                  size="small"
                  type="link"
                  className="text-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      )
    );
  };

  // Open Modal
  const handleModalOpen = (taskId, modelName) => {
    setSelectedTaskId(taskId);
    setSelectedModelName(modelName); // Set the model name dynamically
    setIsModalVisible(true);
  };

  // Close Modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    setFileList([]);
  };

  // Handle file selection
  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select files before uploading.');
      return;
    }

    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('clientFiles', file.originFileObj);
    });
    
    try {
      // Adjust URL to include the model and ensure it fits your API endpoint
      const response = await fetch(
        `${import.meta.env.VITE_REACT_APP_URL}/api/v1/ePassport/fileUpload/${selectedClientId}/${selectedModelName}`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();

      if (data.success) {
        message.success('Files uploaded successfully!');
        setFileList([]);
        setIsModalVisible(false);
      } else {
        message.error(data.message || 'Failed to upload files.');
      }
    } catch (error) {
      message.error('An error occurred while uploading files.');
    }
  };

  return (
    <div className="space-y-4">
      <Modal
        title="Upload Files"
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="back" onClick={handleModalClose}>Cancel</Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
          >
            Upload
          </Button>,
        ]}
      >
        <Upload
          multiple
          fileList={fileList}
          onChange={handleFileChange}
          beforeUpload={() => false} // Prevent auto upload
        >
          <Button icon={<UploadOutlined />}>Select Files</Button>
        </Upload>
      </Modal>

      {renderTaskSection("Visa Applications", clientTasks.applications, "applicationModel")} 
      {renderTaskSection("Document Translations", clientTasks.documentTranslation, "documentTranslationModel")}
      {renderTaskSection("Design Services", clientTasks.graphicDesigns, "GraphicDesignModel")}
      {renderTaskSection("Japan Visit Applications", clientTasks.japanVisit, "japanVisitApplicationModel")}
      {renderTaskSection("E-passport Applications", clientTasks.epassport, "ePassportModel")}
      {renderTaskSection("Other Services", clientTasks.otherServices, "OtherServiceModel")}
    </div>
  );
};

export default FilesTab;


// improve  the ui like upload icon use the icon from lucide icon 



