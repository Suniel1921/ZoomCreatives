import { useState, useMemo, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, Trash2, Mail, Phone, Upload, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../../components/Button";
import AddClientModal from "./AddClientModal";
import EditClientModal from "./EditClientModal"; // Assuming this exists and is correctly implemented
import ImportClientsModal from "./ImportClientsModal"; // Assuming this exists
import PrintAddressButton from "../../components/PrintAddressButton";
import CategoryBadge from "../../components/CategoryBadge";
import axios from "axios";
import type { Client, ClientCategory } from "../../types";
import toast from "react-hot-toast";
import { useAuthGlobally } from "../../context/AuthContext";
import ClientTableSkeleton from "../../components/skeletonEffect/ClientTableSkeleton";
import ProfilePhotoModal from "../../components/profilePhotoPreviewModal/ProfilePhotoModal"; // Assuming this exists
import DeleteConfirmationModal from "../../components/deleteConfirmationModal/DeleteConfirmationModal"; // Assuming this exists
import SearchableSelect from "../../components/SearchableSelect"; // Assuming this exists

const ITEMS_PER_PAGE = 20;

// Ensure categories list is consistent if reused elsewhere
const clientCategories: ClientCategory[] = [
    "Visit Visa Applicant", "Japan Visit Visa Applicant", "Document Translation",
    "Student Visa Applicant", "Epassport Applicant", "Japan Visa",
    "Graphic Design & Printing", "Web Design & Seo", "Birth Registration",
    "Documentation Support", "Other",
];


export default function ClientsPage() {
  // State for Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // State for Data and Filtering/Selection
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null); // For search selection
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null); // For passing data to Edit Modal
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null); // For Delete Confirmation
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | undefined>(undefined); // For Photo Preview Modal URL
  const [photoModalClientName, setPhotoModalClientName] = useState<string>(""); // For Photo Preview Modal Name (FIXED)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ClientCategory | "all">("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // State for UI Control
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [auth] = useAuthGlobally(); // Assuming context provides user info like role

  // --- Data Fetching ---
  const getAllClients = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Ensure the URL is correct and the environment variable is set
      const apiUrl = `${import.meta.env.VITE_REACT_APP_URL}/api/v1/client/getClient`;
      if (!apiUrl) {
          throw new Error("API URL is not configured. Please check VITE_REACT_APP_URL environment variable.");
      }

      const response = await axios.get(apiUrl, {
        params: { forceRefresh }, // Pass forceRefresh if needed by backend
      });

      if (response.data.success && Array.isArray(response.data.clients)) {
        setAllClients(response.data.clients);
      } else {
        console.error("Unexpected response format:", response.data);
        throw new Error("Failed to fetch clients: Invalid data format received.");
      }
    } catch (error: any) {
      console.error("Failed to fetch clients:", error);
      const message = error.response?.data?.message || error.message || "An error occurred while fetching clients.";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed if URL and base path are stable

  useEffect(() => {
    getAllClients();
  }, [getAllClients]); // Fetch clients on initial mount

  // --- Memoized Derived Data ---

  // Options for the searchable select dropdown
  const searchOptions = useMemo(() => {
    return allClients.map((client) => ({
      label: `${client.name.toUpperCase()} (${client.phone || 'No Phone'})`, // More descriptive label
      value: client._id,
    }));
  }, [allClients]);

  // Filtered and sorted clients based on current filters and search selection
  const filteredAndSortedClients = useMemo(() => {
    let filtered = allClients;

    // Apply search ID filter first if selected
    if (selectedClientId) {
      filtered = filtered.filter(client => client._id === selectedClientId);
    } else {
      // Apply category filter if no specific client is searched
      if (selectedCategoryFilter !== "all") {
        filtered = filtered.filter(client => client.category === selectedCategoryFilter);
      }
      // Apply status filter
      if (selectedStatusFilter !== "all") {
        filtered = filtered.filter(client => client.status === selectedStatusFilter);
      }
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.dateJoined || 0).getTime();
      const dateB = new Date(b.createdAt || b.dateJoined || 0).getTime();
      return dateB - dateA; // Descending order
    });
  }, [allClients, selectedCategoryFilter, selectedStatusFilter, selectedClientId]);

  // Paginated clients for the current page display
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedClients, currentPage]);

  // Calculate total pages based on filtered results
  const totalPages = Math.ceil(filteredAndSortedClients.length / ITEMS_PER_PAGE);

  // --- Event Handlers ---

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClientId, selectedCategoryFilter, selectedStatusFilter]);

  // Open Edit Modal
  const handleEditClick = (client: Client) => {
    setSelectedClientForEdit(client);
    setIsEditModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const initiateDelete = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  // Confirm Deletion
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    const toastId = toast.loading(`Deleting client ${clientToDelete.name.toUpperCase()}...`);
    try {
        const apiUrl = `${import.meta.env.VITE_REACT_APP_URL}/api/v1/client/deleteClient/${clientToDelete._id}`;
        if (!apiUrl) {
            throw new Error("API URL is not configured.");
        }
      const response = await axios.delete(apiUrl);
      toast.dismiss(toastId);
      toast.success(response.data.message || "Client deleted successfully.");
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      getAllClients(true); // Force refresh after deletion
      // If the deleted client was the one selected in search, clear the search
      if (selectedClientId === clientToDelete._id) {
        setSelectedClientId(null);
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("Failed to delete client:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to delete client.");
    }
  };

  // Open Photo Preview Modal (FIXED to pass correct name)
  const handlePhotoClick = (photoUrl: string | undefined, clientName: string) => {
    if (!photoUrl) return; // Don't open modal if no photo URL
    setSelectedPhotoUrl(photoUrl);
    setPhotoModalClientName(clientName.toUpperCase()); // Use the actual client's name
    setIsPhotoModalOpen(true);
  };

  // Download client details as text file
  const downloadClientDetails = useCallback((client: Client) => {
    const clientDetails = `Client Details:
Name: ${client.name.toUpperCase()}
Phone: ${client.phone || 'N/A'}
Email: ${client.email || 'N/A'}
Nationality: ${client.nationality || 'N/A'}
Category: ${client.category || 'N/A'}
Status: ${client.status || 'N/A'}

Address:
〒${client.postalCode || 'N/A'}
${client.prefecture || ''}${client.city || ''}${client.street || ''}
${client.building || ''}
`;
    const blob = new Blob([clientDetails.trim()], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${client.name.toUpperCase()}_details.txt`;
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link); // Clean up
    URL.revokeObjectURL(link.href); // Free memory
  }, []);

  // Helper function: Format phone for Viber link (remove non-digits)
  const formatPhoneForViber = (phone: string | undefined): string => {
      return phone ? phone.replace(/\D/g, "") : "";
  };

  // Helper function: Get last 4 digits of ID for display
  const getLastFourDigits = (id: string | undefined): string => {
      return id ? `...${id.slice(-4)}` : 'N/A';
  }

  // Helper function: Get initials from name (more robust)
  const getInitials = (name: string | undefined): string => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return "??"; // Fallback for invalid/empty names
    }
    const words = name.trim().split(/\s+/);
    const firstInitial = words[0]?.charAt(0).toUpperCase() || '';
    const secondInitial = words.length > 1 ? (words[1]?.charAt(0).toUpperCase() || '') : '';
    return `${firstInitial}${secondInitial}` || "??"; // Ensure we return something
  };

  // Handle search selection change
  const handleSearchSelect = (value: string | null) => {
      setSelectedClientId(value);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Users className="h-6 w-6 text-gray-500" />
            <h1 className="text-xl font-semibold text-gray-800 whitespace-nowrap">
              Clients ({loading ? '...' : filteredAndSortedClients.length} total)
            </h1>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap flex-grow justify-end">
              {/* Category Filter */}
              <select
                  value={selectedCategoryFilter}
                  onChange={(e) => {setSelectedCategoryFilter(e.target.value as ClientCategory | "all"); setSelectedClientId(null);}} // Clear search on filter change
                  className="flex h-10 w-full sm:w-auto lg:w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                  aria-label="Filter by category"
              >
                  <option value="all">All Categories</option>
                  {clientCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                  ))}
              </select>

              {/* Status Filter */}
              <select
                  value={selectedStatusFilter}
                  onChange={(e) => {setSelectedStatusFilter(e.target.value as "all" | "active" | "inactive"); setSelectedClientId(null);}} // Clear search on filter change
                  className="flex h-10 w-full sm:w-auto lg:w-36 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                  aria-label="Filter by status"
              >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
              </select>

             {/* Search Client Dropdown */}
             <div className="relative w-full sm:w-auto lg:w-64 flex-grow sm:flex-grow-0">
               <SearchableSelect
                 options={searchOptions}
                 value={selectedClientId}
                 onChange={handleSearchSelect} // Use handler
                 placeholder="Search by Name/Phone"
                 isClearable={true} // Allow clearing the selection
               />
             </div>

             {/* Action Buttons */}
             <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none justify-center text-sm px-3 py-2">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Client</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="flex-1 sm:flex-none justify-center text-sm px-3 py-2"
              >
                <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Import</span>
                 <span className="sm:hidden">Import</span>
              </Button>
             </div>
          </div>
        </div>
      </div>

      {/* Client Table Area */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <ClientTableSkeleton />
          ) : error ? (
            <div className="text-center py-10 px-4 text-red-600 bg-red-50">
              <p className="font-medium">Error loading clients:</p>
              <p className="text-sm">{error}</p>
              <Button onClick={() => getAllClients(true)} variant="outline" size="sm" className="mt-4">
                 Retry
              </Button>
            </div>
          ) : allClients.length === 0 && !loading ? (
             <div className="text-center py-10 px-4 text-gray-500">
               <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
               <h3 className="text-lg font-medium text-gray-700">No Clients Found</h3>
               <p className="text-sm mb-4">There are no clients in the system yet.</p>
               <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add First Client
               </Button>
             </div>
           ) : filteredAndSortedClients.length === 0 && !loading ? (
            <div className="text-center py-10 px-4 text-gray-500">
               <p className="text-lg font-medium text-gray-700">No Matching Clients</p>
               <p className="text-sm">
                  {selectedClientId
                  ? "The selected client does not match the current filters."
                  : "No clients found matching the selected category or status filters."}
               </p>
                <Button
                    onClick={() => {
                        setSelectedCategoryFilter("all");
                        setSelectedStatusFilter("all");
                        setSelectedClientId(null);
                    }}
                    variant="outline" size="sm" className="mt-4">
                    Clear Filters & Search
                </Button>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">ID</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Client Info</th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Contact</th>
                    <th scope="col" className="hidden lg:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Category</th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Status</th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedClients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50 transition-colors duration-150">
                      {/* ID */}
                      <td className="px-3 py-4 sm:px-6 whitespace-nowrap">
                        <span className="text-xs font-mono text-gray-500">{getLastFourDigits(client._id)}</span>
                      </td>

                      {/* Client Info (Photo, Name, Nationality, Mobile Contact) */}
                      <td className="px-3 py-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                           {/* --- START OF CORRECTED IMAGE SECTION --- */}
                           {/* Photo or Initials Container */}
                          <div
                            className="relative flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-brand-yellow/10 overflow-hidden group cursor-pointer" // Added overflow-hidden
                            // Only allow click and show title if photo *should* exist
                            onClick={client.profilePhoto ? () => handlePhotoClick(client.profilePhoto, client.name) : undefined}
                            title={client.profilePhoto ? "View photo" : "No photo available"}
                          >
                            {client.profilePhoto ? (
                              // Display Image if URL exists
                              <img
                                key={`${client._id}-img`} // Add key for stability during re-renders
                                src={client.profilePhoto}
                                alt={`${client.name}`} // Alt text should describe the image (name is good)
                                className="h-full w-full object-cover group-hover:opacity-80 transition-opacity"
                                // Simple onError: Hide the broken image element.
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.visibility = 'hidden'; // Hide but keep space
                                }}
                              />
                            ) : (
                              // Display Initials if no photo URL exists initially
                              <span className="text-brand-black font-medium text-sm select-none">
                                {getInitials(client.name)}
                              </span>
                            )}
                            {/* Optional: Eye icon overlay on hover ONLY if photo exists */}
                            {/* Added pointer-events-none so it doesn't interfere with the onClick */}
                            {client.profilePhoto && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 pointer-events-none">
                                     <Eye className="h-4 w-4 text-white"/>
                                </div>
                            )}
                          </div>
                           {/* --- END OF CORRECTED IMAGE SECTION --- */}

                          {/* Name and Nationality */}
                          <div className="min-w-0 flex-1">
                             <p className="font-medium text-sm text-brand-black truncate" title={client.name}>
                               {client.name.toUpperCase()}
                             </p>
                             <p className="text-xs text-gray-500 truncate" title={client.nationality}>
                               {client.nationality || 'N/A'}
                             </p>
                              {/* Contact Info for Mobile */}
                              <div className="md:hidden mt-1 space-y-0.5">
                                  {client.email && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <Mail className="h-3 w-3 text-gray-400" />
                                        <span className="truncate" title={client.email}>{client.email}</span>
                                    </div>
                                  )}
                                  {client.phone && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <Phone className="h-3 w-3 text-gray-400" />
                                        <a
                                        href={`viber://chat?number=${formatPhoneForViber(client.phone)}`}
                                        className="text-brand-black hover:text-brand-yellow hover:underline truncate"
                                        title={`Contact via Viber: ${client.phone}`}
                                        >
                                        {client.phone}
                                        </a>
                                    </div>
                                  )}
                              </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact (Desktop) */}
                      <td className="hidden md:table-cell px-3 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-700">
                         <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate" title={client.email}>{client.email}</span>
                              </div>
                            )}
                             {client.phone && (
                               <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <a
                                    href={`viber://chat?number=${formatPhoneForViber(client.phone)}`}
                                    className="text-brand-black hover:text-brand-yellow hover:underline truncate"
                                    title={`Contact via Viber: ${client.phone}`}
                                >
                                    {client.phone}
                                </a>
                               </div>
                             )}
                              {!client.email && !client.phone && <span className="text-gray-400 text-xs">No contact info</span>}
                         </div>
                      </td>

                      {/* Category (Desktop) */}
                      <td className="hidden lg:table-cell px-3 py-4 sm:px-6 whitespace-nowrap">
                        <CategoryBadge category={client.category || "Unknown"} />
                      </td>

                      {/* Status (Desktop) */}
                      <td className="hidden md:table-cell px-3 py-4 sm:px-6 whitespace-nowrap text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            client.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {client.status || 'unknown'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-4 sm:px-6 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-1.5 sm:gap-2">
                           <PrintAddressButton client={client} size="sm" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadClientDetails(client)}
                            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Download Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(client)}
                             className="text-gray-500 hover:text-green-600 hover:bg-green-50"
                             title="Edit Client"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {auth?.user?.role === "superadmin" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => initiateDelete(client)}
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                              title="Delete Client"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
               {totalPages > 1 && (
                 <div className="px-4 py-3 sm:px-6 flex items-center justify-between border-t border-gray-200 flex-col sm:flex-row gap-4">
                    <div className="sm:hidden text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-start">
                        <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                        {" "}to{" "}
                        <span className="font-medium">
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedClients.length)}
                        </span>
                        {" "}of <span className="font-medium">{filteredAndSortedClients.length}</span> results
                        </p>
                    </div>
                    <div className="flex justify-center sm:justify-end gap-2">
                        <Button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        aria-label="Go to previous page"
                        >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                        </Button>
                        <Button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        aria-label="Go to next page"
                        >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                 </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        getAllClients={getAllClients}
      />

      {selectedClientForEdit && isEditModalOpen && (
        <EditClientModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedClientForEdit(null);
          }}
          getAllClients={getAllClients}
          client={selectedClientForEdit}
        />
      )}

      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        getAllClients={getAllClients}
      />

      {clientToDelete && isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
              setIsDeleteModalOpen(false);
              setClientToDelete(null);
            }}
          onConfirm={handleDeleteConfirm}
          itemName={clientToDelete.name.toUpperCase() || "this client"}
          itemType="client"
        />
       )}

       <ProfilePhotoModal
         isOpen={isPhotoModalOpen}
         onClose={() => setIsPhotoModalOpen(false)}
         photoUrl={selectedPhotoUrl}
         clientName={photoModalClientName}
       />
    </div>
  );
}