exports.success = (res, message, data, code = 200) => {
    res.status(code).json({ code, message, data });
  };
  
  exports.error = (res, message, code = 500) => {
    res.status(code).json({ code, message, data: null });
  };
  