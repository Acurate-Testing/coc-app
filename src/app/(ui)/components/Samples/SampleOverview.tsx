"use client";
import { useEffect, useState } from "react";

const SampleOverview = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/samples/overview");
        const data = await res.json();
        setOverview(data.overview);
      } catch (err) {
        console.error("Failed to fetch sample overview", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const cards = [
    {
      title: "Pending",
      value: overview?.byStatus?.pending,
      bgColor: "#FEF3C7",
      textColor: "#B45309",
    },
    {
      title: "In-COC",
      value: overview?.byStatus?.in_coc,
      bgColor: "#DBEAFE",
      textColor: "#1D4ED8",
    },
    {
      title: "Submitted",
      value: overview?.byStatus?.submitted,
      bgColor: "#D1FAE5",
      textColor: "#047857",
    },
    {
      title: "Failed",
      value: overview?.byStatus?.fail,
      bgColor: "#fee2e2",
      textColor: "#dc2626",
    },
  ];

  // if (loading) return <div>Loading...</div>;
  // if (!overview) return <div>Failed to load data</div>;

  return (
    <div className="w-full md:p-8 p-6">
      <div style={styles.grid} className="md:gap-6 gap-5">
        {cards.map((card) => (
          <div
            key={card.title}
            style={styles.card(card.bgColor, card?.textColor)}
          >
            <div className="font-bold text-center text-2xl">
              {loading ? (
                <div className="flex items-center justify-center w-10 h-8 mx-auto rounded-lg bg-gray-200"></div>
              ) : (
                (() => {
                  let displayValue;
                  if (card.value > 999) {
                    displayValue = "999+";
                  } else {
                    displayValue = card.value;
                  }
                  return displayValue;
                })()
              )}
            </div>
            <div className="text-center mb-2 text-base">{card.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SampleOverview;
