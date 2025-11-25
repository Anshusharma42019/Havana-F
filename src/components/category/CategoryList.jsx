// src/components/category/CategoryList.jsx
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from 'react-hot-toast';
import CategoryForm from "./CategoryForm";
import Pagination from "../common/Pagination";
import DashboardLoader from '../DashboardLoader';

const CategoryList = () => {
  const { axios } = useAppContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({
    _id: null,
    name: "",
    description: "",
    basePrice: "",
    status: "active",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch all categories
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await fetchCategories();
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "/api/categories/all"
      );
      setCategories(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch categories");
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditMode(false);
    setCurrentCategory({
      _id: null,
      name: "",
      description: "",
      basePrice: "",
      status: "active",
    });
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    setEditMode(true);
    setCurrentCategory({
      _id: category._id,
      name: category.name,
      description: category.description,
      basePrice: category.basePrice || "",
      status: category.status,
    });
    setShowModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await axios.delete(`/api/categories/delete/${id}`);
        setCategories(categories.filter((category) => category._id !== id));
        toast.success("Category deleted successfully");
      } catch (err) {
        console.error("Error deleting category:", err);
        toast.error("Failed to delete category");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        // Update existing category
        const { data } = await axios.put(
          `/api/categories/update/${currentCategory._id}`,
          {
            name: currentCategory.name,
            description: currentCategory.description,
            basePrice: currentCategory.basePrice,
            status: currentCategory.status,
          }
        );

        setCategories(
          categories.map((category) =>
            category._id === currentCategory._id ? data : category
          )
        );
        toast.success("Category updated successfully");
      } else {
        // Create new category
        const { data } = await axios.post(
          "/api/categories/add",
          {
            name: currentCategory.name,
            description: currentCategory.description,
            basePrice: currentCategory.basePrice,
            status: currentCategory.status,
          }
        );

        setCategories([...categories, data]);
        toast.success("Category added successfully");
      }

      setShowModal(false);
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error("Failed to save category");
    }
  };

  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = categories.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Room Categories" />;
  }

  return (
    <div className="p-6 overflow-auto h-full bg-background">
      <div className="flex justify-between items-center mb-8 mt-6 ">
        <h1 className="text-3xl font-extrabold text-[#1f2937]">
          Room Categories
        </h1>
        <button
          onClick={handleAddCategory}
          className="bg-secondary text-dark px-4 py-2  cursor-pointer rounded-lg hover:shadow-lg transition-shadow font-medium"
        >
          <Plus size={18} className="w-4 h-4 inline mr-2" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading categories...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className="bg-white divide-y divide-gray-200 overflow-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {paginatedCategories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {category.name}
                  </td>
                  <td className="px-6 py-4">{category.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          category.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                    >
                      {category.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-50"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="p-1 rounded-full text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedCategories.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No categories found. Add a new category to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={categories.length}
          />
        </div>
      )}

      {/* Use the separated CategoryForm component */}
      <CategoryForm
        showModal={showModal}
        setShowModal={setShowModal}
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
        handleSubmit={handleSubmit}
        editMode={editMode}
      />
    </div>
  );
};

export default CategoryList;
