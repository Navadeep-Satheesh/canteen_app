"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";

async function fetchData(endpoint) {
  const token = getToken();
  if (!token) return [];

  const res = await fetch(`/api/admin/stats/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.ok ? res.json() : [];
}

export default function StatsPage() {
  const [monthly, setMonthly] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [average, setAverage] = useState([]);

  useEffect(() => {
    fetchData("monthly-meals").then(setMonthly);
    fetchData("weekly-meals").then(setWeekly);
    fetchData("average-daily").then(setAverage);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Statistics Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Monthly Meal Consumption</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Meals" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Weekly Meal Consumption</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekly}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Meals" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Average Weekly Meals (per day)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={average}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="average" name="Average Meals" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
