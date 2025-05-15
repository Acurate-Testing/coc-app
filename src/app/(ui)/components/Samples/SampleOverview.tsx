const SampleOverview = () => {
  const styles = {
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    },
    card: (bgColor: string, textColor: string) => ({
      backgroundColor: bgColor,
      padding: "16px",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      color: textColor,
    }),
  };

  const cards = [
    {
      title: "Pending",
      value: 12,
      bgColor: "#FEF3C7",
      textColor: "#B45309",
    },
    {
      title: "In-COC",
      value: 8,
      bgColor: "#DBEAFE",
      textColor: "#1D4ED8",
    },
    {
      title: "Submitted",
      value: 45,
      bgColor: "#D1FAE5",
      textColor: "#047857",
    },
    {
      title: "Failed",
      value: 2,
      bgColor: "#fee2e2",
      textColor: "#dc2626",
    },
  ];
  return (
    <div className="w-full md:p-8 p-6">
      <div style={styles.grid} className="md:gap-6 gap-5">
        {cards.map((card) => (
          <div
            key={card.title}
            style={styles.card(card.bgColor, card?.textColor)}
          >
            <div className="font-bold text-center text-2xl">{card.value}</div>
            <div className="text-center mb-2 text-base">{card.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SampleOverview;
