import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import Button from "../../components/Button";
import Input from "../../components/Input";
import SearchableSelect from "../../components/SearchableSelect";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { countries } from "../../utils/countries";
import axios from "axios";
import TodoList from "../../components/TodoList";
import FamilyMembersList from "./components/FamilyMembersList";
import PaymentDetails from "./components/PaymentDetails";
import type { FamilyMember } from "../../types";
import toast from "react-hot-toast";

// Updated validation schema with required fields
const applicationSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  type: z.enum(["Visitor Visa", "Student Visa"]),
  country: z.string().min(1, "Country is required"),
  documentStatus: z.enum(["Not Yet", "Few Received", "Fully Received"]),
  documentsToTranslate: z.number().min(0),
  translationStatus: z.enum(["Under Process", "Completed"]),
  visaStatus: z.enum(["Processing", "Waiting for Payment", "Completed", "Cancelled"]),
  deadline: z.date(),
  payment: z.object({
    visaApplicationFee: z.number().min(0),
    translationFee: z.number().min(0),
    paidAmount: z.number().min(0),
    discount: z.number().min(0),
  }),
  paymentStatus: z.enum(["Due", "Paid"]).optional(),
  notes: z.string().optional(),
  todos: z
    .array(
      z.object({
        id: z.string(),
        task: z.string(),
        completed: z.boolean(),
        priority: z.enum(["Low", "Medium", "High"]),
        dueDate: z.date().optional(),
      })
    )
    .default([]),
  handledBy: z.string().min(1, "Visa Application Handler is required"),
  translationHandler: z.string().min(1, "Document Translation Handler is required"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface AddApplicationModalProps {
  isOpen: boolean;
  getAllApplication: () => void;
  onClose: () => void;
}

interface Handler {
  id: string;
  name: string;
}

export default function AddApplicationModal({
  isOpen,
  onClose,
  getAllApplication,
}: AddApplicationModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [handlers, setHandlers] = useState<Handler[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      documentStatus: "Not Yet",
      documentsToTranslate: 0,
      translationStatus: "Under Process",
      visaStatus: "Processing",
      deadline: new Date(),
      payment: {
        visaApplicationFee: 0,
        translationFee: 0,
        paidAmount: 0,
        discount: 0,
      },
      todos: [],
    },
  });

  const handleFamilyMembersChange = (updatedMembers: FamilyMember[]) => {
    setFamilyMembers(updatedMembers);
  };

  // Fetch clients
  useEffect(() => {
    if (isOpen) {
      axios
        .get(`${import.meta.env.VITE_REACT_APP_URL}/api/v1/client/getClient`)
        .then((response) => {
          const clientsData = response?.data?.clients;
          setClients(Array.isArray(clientsData) ? clientsData : [clientsData]);
        })
        .catch((error) => {
          console.error("Error fetching clients:", error);
          setClients([]);
        });
    }
  }, [isOpen]);

  // Fetch handlers
  useEffect(() => {
    const fetchHandlers = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_URL}/api/v1/admin/getAllAdmin`
        );
        // Map admins to { id: ObjectId, name: string }
        setHandlers(
          response.data.admins.map((admin: any) => ({
            id: admin._id,
            name: admin.name,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch handlers:", error);
        toast.error("Failed to fetch handlers.");
      }
    };
    fetchHandlers();
  }, []);

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      const client = clients.find((c) => c._id === data.clientId);
      if (!client) {
        toast.error("Client not found");
        return;
      }

      const visaHandler = handlers.find((h) => h.id === data.handledBy);
      const translationHandler = handlers.find(
        (h) => h.id === data.translationHandler
      );

      if (!visaHandler || !translationHandler) {
        toast.error("Invalid handler selected");
        return;
      }

      const total =
        data.payment.visaApplicationFee +
        data.payment.translationFee -
        (data.payment.paidAmount + data.payment.discount);

      const payload = {
        ...data,
        clientName: client.name,
        handledBy: visaHandler.name, // Store name in DB
        translationHandler: translationHandler.name, // Store name in DB
        handlerId: data.handledBy, // Use ObjectId for notification
        familyMembers,
        submissionDate: new Date().toISOString(),
        payment: { ...data.payment, total },
        paymentStatus: total <= 0 ? "Paid" : "Due",
      };

      console.log("Sending application payload:", payload);

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_URL}/api/v1/visaApplication/createVisaApplication`,
        payload
      );

      if (response.data.success) {
        toast.success(response.data.message);
        reset();
        setFamilyMembers([]);
        onClose();
        getAllApplication();
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      if (error.response) {
        toast.error(error.response.data.message);
      }
    }
  };

  if (!isOpen) return null;

  // Common input class for consistent styling
  const inputClass =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">New Application</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Client Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">
              Client Information
            </h3>
            <div className="space-y-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Client
                </label>
                <SearchableSelect
                  options={clients.map((client) => ({
                    value: client._id,
                    label: client.name,
                    clientData: { ...client, profilePhoto: client.profilePhoto },
                  }))}
                  value={watch("clientId")}
                  onChange={(value) => setValue("clientId", value)}
                  placeholder="Select client"
                  error={errors.clientId?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Country</label>
                  <select {...register("country")} className={inputClass}>
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className={errorClass}>{errors.country.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Visa Type</label>
                  <select {...register("type")} className={inputClass}>
                    <option value="Visitor Visa">Visitor Visa</option>
                    <option value="Student Visa">Student Visa</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">
              Application Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Application Deadline</label>
                <DatePicker
                  selected={watch("deadline")}
                  onChange={(date) => setValue("deadline", date as Date)}
                  className={inputClass}
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className={labelClass}>Document Status</label>
                <select {...register("documentStatus")} className={inputClass}>
                  <option value="Not Yet">Not Yet</option>
                  <option value="Few Received">Few Received</option>
                  <option value="Fully Received">Fully Received</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Job Status</label>
                <select {...register("visaStatus")} className={inputClass}>
                  <option value="Processing">Processing</option>
                  <option value="Waiting for Payment">Waiting for Payment</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Documents to Translate</label>
                <Input
                  type="number"
                  {...register("documentsToTranslate", { valueAsNumber: true })}
                  className={inputClass}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Document Handling */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">
              Document Handling
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>
                  Visa Application Handled By
                </label>
                <select {...register("handledBy")} className={inputClass}>
                  <option value="">Select handler</option>
                  {handlers.map((handler) => (
                    <option key={handler.id} value={handler.id}>
                      {handler.name}
                    </option>
                  ))}
                </select>
                {errors.handledBy && (
                  <p className={errorClass}>{errors.handledBy.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Translation Handled By</label>
                <select
                  {...register("translationHandler")}
                  className={inputClass}
                >
                  <option value="">Select handler</option>
                  {handlers.map((handler) => (
                    <option key={handler.id} value={handler.id}>
                      {handler.name}
                    </option>
                  ))}
                </select>
                {errors.translationHandler && (
                  <p className={errorClass}>
                    {errors.translationHandler.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">
              Payment Details
            </h3>
            <PaymentDetails
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              inputClass={inputClass}
              labelClass={labelClass}
              errorClass={errorClass}
            />
          </div>

          {/* Family Members Section */}
           <div className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">Family Members</h3>
            <FamilyMembersList
              familyMembers={familyMembers}
              onFamilyMembersChange={handleFamilyMembersChange}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          </div>

          {/* To-Do List Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">To-Do List</h3>
            <TodoList
              todos={watch("todos") || []}
              onTodosChange={(newTodos) => setValue("todos", newTodos)}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          </div>

          {/* Notes Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">Notes</h3>
            <div>
              <textarea
                {...register("notes")}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}