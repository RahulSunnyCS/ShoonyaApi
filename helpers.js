module.exports.getPositions = async () => {
  try {
    const response = await api.get_positions();
  } catch (err) {}
};
