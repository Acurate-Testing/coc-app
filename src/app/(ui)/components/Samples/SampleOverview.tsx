"use client";
import { UserRole } from '@/constants/enums';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from "react";

const SampleOverview = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

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

  const userCards = [
    {
      title: 'Pending',
      value: overview?.byStatus?.pending,
      bgColor: '#FEF3C7', // Amber/Yellow background
      textColor: '#B45309',
      role: [UserRole.USER, UserRole.AGENCY],
    },
    {
      title: 'In-COC',
      value: overview?.byStatus?.in_coc,
      bgColor: '#DBEAFE', // Blue background
      textColor: '#1D4ED8',
      role: [UserRole.USER, UserRole.AGENCY],
    },
    {
      title: 'Submitted',
      value: overview?.byStatus?.submitted,
      bgColor: '#E9D5FF', // Purple background - changed
      textColor: '#7E22CE', // Purple text - changed
      role: [UserRole.USER, UserRole.AGENCY, UserRole.LABADMIN],
    },
    {
      title: 'Failed',
      value: overview?.byStatus?.fail,
      bgColor: '#fee2e2', // Red background
      textColor: '#dc2626',
      role: [UserRole.USER, UserRole.AGENCY, UserRole.LABADMIN],
    },
    {
      title: 'Pass',
      value: overview?.byStatus?.pass,
      bgColor: '#D1FAE5', // Green background
      textColor: '#047857',
      role: [UserRole.LABADMIN, UserRole.USER, UserRole.AGENCY],
    },
  ];

  // Filter cards based on user role
  const visibleCards = userCards.filter((card) =>
    card.role.includes(session?.user?.role as UserRole),
  );

  return (
    <div className='w-full md:p-8 p-6'>
      <div style={styles.grid} className='md:gap-6 gap-5'>
        {visibleCards.map((card) => (
          <div key={card.title} style={styles.card(card.bgColor, card?.textColor)}>
            <div className='font-bold text-center text-2xl'>
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
