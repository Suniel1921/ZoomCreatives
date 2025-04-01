import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, Key, Eye, EyeOff } from "lucide-react";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { fetchJapaneseAddress } from "../../services/addressService";
import { countries } from "../../utils/countries";
import { createClientSchema } from "../../utils/clientValidation";
import type { ClientCategory } from "../../types";
import axios from "axios";
import toast from "react-hot-toast";

const categories: ClientCategory[] = [
  "Visit Visa Applicant",
  "Japan Visit Visa Applicant",
  "Document Translation",
  "Student Visa Applicant",
  "Epassport Applicant",
  "Japan Visa",
  'Graphic Design & Printing',
   'Web Design & Seo',
   'Birth Registration',
   'Documentation Support',
   'Other'
];

// Define categories where address fetching/validation might be optional
const optionalAddressCategories: ClientCategory[] = [
  "Document Translation",
  "Epassport Applicant",
  "Japan Visa",
  "Graphic Design & Printing",
  "Web Design & Seo",
  "Birth Registration",
  "Documentation Support",
  "Other"
];

interface AddClientModalProps {
  isOpen: boolean;
  getAllClients: () => void;
  onClose: () => void;
}

// Default password - consider if this needs to be more secure or configurable
const DEFAULT_PASSWORD = "zoom"; // Use a more secure default or generate one

export default function AddClientModal({
  isOpen,
  onClose,
  getAllClients,
}: AddClientModalProps) {
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ClientCategory | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const isAddressOptional = selectedCategory ? optionalAddressCategories.includes(selectedCategory) : true;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }, // Add isSubmitting for button state
  } = useForm({
    // Dynamically update resolver based on selected category
    resolver: zodResolver(createClientSchema(selectedCategory)),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      nationality: "",
      facebookUrl: "",
      status: "active",
      category: undefined,
      address: {
        postalCode: "",
        prefecture: "",
        city: "",
        street: "",
        building: "",
      },
      modeOfContact: [],
      password: "", // Start with empty password
      profilePhoto: undefined, // Use undefined for optional photo
    },
  });

  const postalCode = watch("address.postalCode");
  const selectedModes = watch("modeOfContact");

  // Reset form and local state when modal closes or category changes significantly
  useEffect(() => {
    if (!isOpen) {
      reset(); // Reset react-hook-form state
      setProfilePhotoPreview(null); // Reset local preview state
      setFiles(null);
      setAddressError(null);
      setIsAddressLoading(false);
      setSelectedCategory(undefined);
      setShowPassword(false);
      setFileError(null);
    }
  }, [isOpen, reset]);

  const handlePostalCodeChange = useCallback(async (code: string) => {
    // Only fetch if category requires address and code is valid
    if (isAddressOptional || !code) {
        setAddressError(null); // Clear any previous error if address is optional now
        return;
    }

    const cleanPostalCode = code.replace(/\D/g, "");
    setAddressError(null); // Clear previous errors

    if (cleanPostalCode.length === 7) {
      setIsAddressLoading(true);
      try {
        const address = await fetchJapaneseAddress(cleanPostalCode);
        if (address) {
          setValue("address.prefecture", address.prefecture, { shouldValidate: true });
          setValue("address.city", address.city, { shouldValidate: true });
          setValue("address.street", address.town, { shouldValidate: true });
          setAddressError(null); // Clear error on success
        } else {
          setAddressError("No address found for this postal code.");
          setValue("address.prefecture", "", { shouldValidate: true });
          setValue("address.city", "", { shouldValidate: true });
          setValue("address.street", "", { shouldValidate: true });
        }
      } catch (error) {
        setAddressError("Failed to fetch address. Please check connection.");
        console.error("Failed to fetch address:", error);
         // Optionally clear fields on fetch error
         setValue("address.prefecture", "", { shouldValidate: true });
         setValue("address.city", "", { shouldValidate: true });
         setValue("address.street", "", { shouldValidate: true });
      } finally {
        setIsAddressLoading(false);
      }
    } else if (cleanPostalCode.length > 0 && cleanPostalCode.length < 7) {
       // Clear fields if postal code is partially entered but not 7 digits
       setValue("address.prefecture", "", { shouldValidate: true });
       setValue("address.city", "", { shouldValidate: true });
       setValue("address.street", "", { shouldValidate: true });
    } else if (cleanPostalCode.length === 0){
        // Clear fields if postal code is empty
        setValue("address.prefecture", "", { shouldValidate: true });
        setValue("address.city", "", { shouldValidate: true });
        setValue("address.street", "", { shouldValidate: true });
        setAddressError(null); // Also clear any lingering error message
    }
  }, [setValue, isAddressOptional]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    setFileError(null); // Clear previous file error

    if (fileList && fileList[0]) {
      const file = fileList[0];

      // File size validation (e.g., 2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setFileError("File is too large. Maximum size is 2MB.");
        setProfilePhotoPreview(null); // Clear preview
        setValue("profilePhoto", undefined); // Clear form value
        setFiles(null); // Clear file list state
        event.target.value = ""; // Reset file input
        return;
      }

      // File type validation
       if (!file.type.startsWith('image/')) {
         setFileError("Invalid file type. Please upload an image.");
         setProfilePhotoPreview(null);
         setValue("profilePhoto", undefined);
         setFiles(null);
         event.target.value = "";
         return;
       }


      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
        // Don't set base64 to form value if sending file directly
      };
      reader.readAsDataURL(file);
      setFiles(fileList); // Store the FileList for submission
    } else {
      // No file selected or selection cancelled
      setProfilePhotoPreview(null);
      setValue("profilePhoto", undefined);
      setFiles(null);
    }
  };


  const handleModeOfContactChange = (mode: string) => {
    const currentModes = watch("modeOfContact") || [];
    const newModes = currentModes.includes(mode)
      ? currentModes.filter((m) => m !== mode)
      : [...currentModes, mode];
    setValue("modeOfContact", newModes, { shouldValidate: true });
  };

  // Update selectedCategory state and reset form partially when category changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as ClientCategory;
    setSelectedCategory(newCategory);
    const currentValues = watch();
    reset({
        ...currentValues, // Keep existing values
        category: newCategory, // Update category
        // Reset address fields if validation rules change drastically, or let validation handle it
        address: {
            postalCode: currentValues.address?.postalCode, // Keep postal code
            prefecture: '', // Reset derived fields
            city: '',
            street: '',
            building: currentValues.address?.building, // Keep building
        },
    }, { keepDefaultValues: false }); // Use reset options carefully

    // Clear address error if new category makes it optional
    const newIsAddressOptional = optionalAddressCategories.includes(newCategory);
    if (newIsAddressOptional) {
        setAddressError(null);
    }
    // Trigger address fetch if a valid postal code exists and address is not optional
    const currentPostalCode = currentValues.address?.postalCode;
     if (currentPostalCode && currentPostalCode.replace(/\D/g, "").length === 7 && !newIsAddressOptional) {
         handlePostalCodeChange(currentPostalCode);
     } else if (!newIsAddressOptional) {
         // If address is mandatory for new category but postal code wasn't valid, clear fields
         handlePostalCodeChange(currentPostalCode || ""); // This will clear fields if code is not length 7
     }

  };

  const onSubmit = async (data: any) => {
    const toastId = toast.loading("Creating client account...");

    try {
      // Use FormData to handle file uploads correctly
      const formData = new FormData();

      // Append all standard fields
      formData.append("name", data.name);
      formData.append("category", data.category);
      formData.append("status", data.status);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("phone", data.phone);
      formData.append("nationality", data.nationality);
      formData.append("postalCode", data.address.postalCode || ""); // Handle potentially empty optional fields
      formData.append("prefecture", data.address.prefecture || "");
      formData.append("city", data.address.city || "");
      formData.append("street", data.address.street || "");
      formData.append("building", data.address.building || "");
      formData.append("facebookUrl", data.facebookUrl || "");
      formData.append("modeOfContact", JSON.stringify(data.modeOfContact || []));

      // Append the profile photo file if selected
      if (files && files.length > 0) {
        formData.append("profilePhoto", files[0]); // Send the actual file
      }

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_URL}/api/v1/client/createClient`,
        formData // Send FormData
      );

      toast.dismiss(toastId); // Dismiss loading toast

      if (response.data.success) {
        // Display credentials clearly in the success toast
        toast.success(
            `Client ${data.name} created!\n\nCredentials:\nUsername: ${data.email}\nPassword: ${data.password}\n\nPlease save and share securely.`,
            { duration: 10000 } // Keep toast longer
        );
        getAllClients(); // Refresh the client list in the parent component
        onClose(); // Close the modal
        // Resetting is handled by the useEffect hook on `isOpen` change
      } else {
        // Use server message if available, otherwise generic error
        toast.error(response.data.message || "Failed to create client. Please try again.");
      }
    } catch (error: any) {
      toast.dismiss(toastId); // Dismiss loading toast on error
      console.error("Client creation error:", error);
      // Provide more specific error feedback
      if (error.response) {
        toast.error(
          error.response.data?.message || `Server error: ${error.response.status}. Please try again.`
        );
      } else if (error.request) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  // Close modal if isOpen becomes false (e.g., background click)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg p-6 md:p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Add New Client</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 transition-colors rounded-full p-1"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-200 flex items-center justify-center bg-gray-100">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                   <Upload className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-brand-yellow rounded-full p-2 cursor-pointer hover:bg-yellow-500 transition-colors shadow-md">
                <Upload className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg" // Be specific about accepted types
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
             {fileError && (
              <p className="text-sm text-red-600 text-center mt-1">{fileError}</p>
            )}
             {!fileError && <p className="text-xs text-gray-500 text-center">Max 2MB (JPG, PNG)</p>}
          </div>

          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
             {/* Name */}
             <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
              <Input id="name" {...register("name")} placeholder="Enter client's full name" error={!!errors.name} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message as string}</p>}
            </div>

            {/* Category */}
             <div className="space-y-1">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                id="category"
                {...register("category")}
                value={selectedCategory || ""} // Control select value via state for consistency after reset
                onChange={handleCategoryChange}
                className={`w-full rounded-md border shadow-sm h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 ${errors.category ? 'border-red-500' : 'border-gray-300 focus:border-brand-yellow'}`}
              >
                <option value="" disabled>Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
               {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message as string}</p>}
            </div>

             {/* Email */}
             <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
              <Input id="email" {...register("email")} type="email" placeholder="client@example.com" error={!!errors.email} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message as string}</p>}
            </div>

             {/* Password */}
             <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
              <div className="relative">
                <Input
                  id="password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="pr-16" // Adjust padding for two icons
                   error={!!errors.password}
                />
                {/* Toggle Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                 {/* Set Default Password */}
                <button
                  type="button"
                   onClick={() => setValue("password", DEFAULT_PASSWORD, { shouldValidate: true })}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  title={`Set default password (${DEFAULT_PASSWORD})`}
                  aria-label="Set default password"
                >
                  <Key className="h-4 w-4" />
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message as string}</p>}
            </div>

            {/* Phone */}
             <div className="space-y-1">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone *</label>
              <Input id="phone" {...register("phone")} type="tel" placeholder="e.g., 080-1234-5678" error={!!errors.phone} />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message as string}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status *</label>
                <select
                    id="status"
                    {...register("status")}
                    className={`w-full rounded-md border shadow-sm h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 ${errors.status ? 'border-red-500' : 'border-gray-300 focus:border-brand-yellow'}`}
                 >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                 {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status.message as string}</p>}
            </div>

            {/* Nationality */}
            <div className="space-y-1">
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationality *</label>
              <select
                id="nationality"
                {...register("nationality")}
                className={`w-full rounded-md border shadow-sm h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 ${errors.nationality ? 'border-red-500' : 'border-gray-300 focus:border-brand-yellow'}`}
               >
                <option value="">Select Nationality</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>{country.name}</option>
                ))}
              </select>
              {errors.nationality && <p className="text-xs text-red-600 mt-1">{errors.nationality.message as string}</p>}
            </div>

            {/* Facebook URL */}
            <div className="space-y-1">
              <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700">
                Facebook URL <span className="text-gray-500">(Optional)</span>
              </label>
              <Input id="facebookUrl" {...register("facebookUrl")} placeholder="https://facebook.com/profile" error={!!errors.facebookUrl}/>
               {errors.facebookUrl && <p className="text-xs text-red-600 mt-1">{errors.facebookUrl.message as string}</p>}
            </div>
          </div>

          {/* Address Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-lg mb-4 text-gray-800">
              Address
              {isAddressOptional && <span className="text-sm text-gray-500 font-normal ml-2">(Optional for this category)</span>}
             </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Postal Code */}
              <div className="md:col-span-2 space-y-1">
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal Code {!isAddressOptional && '*'}</label>
                 <div className="relative">
                    <Input
                        id="postalCode"
                        {...register("address.postalCode")}
                        onChange={(e) => {
                        const value = e.target.value;
                        // Format postal code input: xxx-xxxx
                        const formatted = value
                            .replace(/\D/g, "") // Remove non-digits
                            .replace(/^(\d{3})(\d{0,4})/, "$1-$2") // Add hyphen
                            .substring(0, 8); // Limit length
                        setValue("address.postalCode", formatted, { shouldValidate: true });
                        handlePostalCodeChange(formatted); // Trigger fetch/clear based on formatted value
                        }}
                        placeholder="e.g., 100-0000"
                        maxLength={8}
                         error={!!errors.address?.postalCode || !!addressError}
                        disabled={isAddressLoading} // Disable while loading
                        className="peer" // Add peer class for sibling selectors if needed
                    />
                     {isAddressLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-brand-yellow"></div>
                    )}
                 </div>
                 {/* Display API error or validation error */}
                {addressError && <p className="text-xs text-red-600 mt-1">{addressError}</p>}
                {errors.address?.postalCode && !addressError && <p className="text-xs text-red-600 mt-1">{errors.address.postalCode.message as string}</p>}
              </div>

              {/* Prefecture */}
              <div className="space-y-1">
                <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700">Prefecture {!isAddressOptional && '*'}</label>
                <Input id="prefecture" {...register("address.prefecture")} readOnly disabled={isAddressLoading} placeholder="Prefecture (auto-filled)" error={!!errors.address?.prefecture}/>
                 {errors.address?.prefecture && <p className="text-xs text-red-600 mt-1">{errors.address.prefecture.message as string}</p>}
              </div>

               {/* City */}
              <div className="space-y-1">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City {!isAddressOptional && '*'}</label>
                <Input id="city" {...register("address.city")} readOnly disabled={isAddressLoading} placeholder="City (auto-filled)" error={!!errors.address?.city}/>
                 {errors.address?.city && <p className="text-xs text-red-600 mt-1">{errors.address.city.message as string}</p>}
              </div>

               {/* Street */}
              <div className="md:col-span-2 space-y-1">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">Street/Town {!isAddressOptional && '*'}</label>
                <Input id="street" {...register("address.street")} readOnly disabled={isAddressLoading} placeholder="Street/Town (auto-filled)" error={!!errors.address?.street}/>
                 {errors.address?.street && <p className="text-xs text-red-600 mt-1">{errors.address.street.message as string}</p>}
              </div>

              {/* Building */}
              <div className="md:col-span-2 space-y-1">
                <label htmlFor="building" className="block text-sm font-medium text-gray-700">Building & Apartment <span className="text-gray-500">(Optional)</span></label>
                <Input
                  id="building"
                  {...register("address.building")}
                  placeholder="e.g., Sunshine Bldg, Apt 101"
                   error={!!errors.address?.building}
                />
                {errors.address?.building && <p className="text-xs text-red-600 mt-1">{errors.address.building.message as string}</p>}
              </div>
            </div>
          </div>

          {/* Contact Preferences Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-lg mb-4 text-gray-800">Contact Preferences</h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {["Direct Call", "Viber", "WhatsApp", "Facebook Messenger"].map((mode) => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    value={mode} // Ensure value is set for potential form handling
                    checked={(selectedModes || []).includes(mode)}
                    onChange={() => handleModeOfContactChange(mode)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-yellow focus:ring-brand-yellow focus:ring-offset-0 focus:ring-1"
                  />
                  <span className="text-sm text-gray-700 select-none">{mode}</span>
                </label>
              ))}
            </div>
             {errors.modeOfContact && <p className="text-xs text-red-600 mt-2">{errors.modeOfContact.message as string}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 mt-8">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isAddressLoading}>
              {isSubmitting ? "Adding Client..." : "Add Client"}
            </Button>
          </div>
        </form>
      </div>

     
    </div>
  );
}