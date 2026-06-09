module.exports = function (source) {
  if (source.includes('import.meta.url')) {
    return source.replace(/import\.meta\.url/g, 'import.meta.url.toString()');
  }
  return source;
};
