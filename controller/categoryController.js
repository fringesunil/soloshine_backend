const Category = require("../model/categoryModel");

const getAllcategory = async (req, res) => {
    try {
        const category = await Category.find().exec();
        res.status(200).json({
            success: true,
            data: category,
            message: "Category retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Server error",
            error: error.message
        });
    }
}

const getCategorybyid = async (req, res) => {
    try {
        const category = await Category.findById(req.params.categoryid).exec();
        if (!category) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            data: category,
            message: "Category retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Server error",
            error: error.message
        });
    }
}

const addCategory = async (req, res) => {
    try {
    const { categoryname } = req.body;
    if (!categoryname) {
      return res.status(400).json({
        success: false,
         data: [],
        message: "Category name is required"
      });
    }

    const existingCategory = await Category.findOne({ categoryname });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
         data: [],
        message: "Category already exists"
      });
    }

    const category = new Category(req.body);
    const savedCategory = await category.save();
    
    res.status(201).json({
      success: true,
      data: savedCategory,
      message: "Category created successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
       data: [],
      message: error.message,
    });
  }
  };

const updateCategory = async (req, res) => {
  try {
    const { categoryname } = req.body;
    if (categoryname) {
      const existingCategory = await Category.findOne({ 
        categoryname, 
        _id: { $ne: req.params.categoryid } 
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
           data: [],
          message: "Category name already exists"
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.categoryid,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
         data: [],
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: "Category updated successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
       data: [],
      message: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.categoryid);
    
    if (!category) {
      return res.status(404).json({
        success: false,
         data: [],
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
       data: [],
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
        data: [],
      message: error.message,
    });
  }
};


  module.exports={
   getAllcategory,
   getCategorybyid,
   addCategory,
   updateCategory,
   deleteCategory
  }