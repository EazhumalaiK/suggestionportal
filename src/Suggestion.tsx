import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

interface ApiProjectSuggestion {
  WorkName: string;
  EstimatedCost: number;
  ProjectScores: {
    ProjectedCost: number;
    Safety: number;
    Compliance: number;
    Environmental: number;
    Efficiency: number;
    Innovation: number;
  };
}

interface Suggestion {
  id: number;
  workName: string;
  estimatedCost: string;
  scores: {
    projectedCost: string;
    safety: number;
    compliance: number;
    environmental: number;
    efficiency: number;
    innovation: number;
  };
}

const initialSuggestions: Suggestion[] = [];

const ScoreBar: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div className="mb-2">
    <div className="text-sm font-medium mb-1">
      {label}: {value}%
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

const Suggestion: React.FC = () => {
  const [suggestions, setSuggestions] =
    useState<Suggestion[]>(initialSuggestions);
  const [modalOpen, setModalOpen] = useState(false);
  const [workName, setWorkName] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [decisions, setDecisions] = useState<
    Record<number, "approved" | "rejected" | null>
  >({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          "https://suggestionportal100-sandbox.mxapps.io/rest/myservice/v1/project"
        );
        const data: ApiProjectSuggestion[] = await res.json();

        const mappedSuggestions = data.map((item, index) => ({
          id: Date.now() + index,
          workName: item.WorkName,
          estimatedCost: `$${item.EstimatedCost}`,
          images: [],
          files: [],
          scores: {
            projectedCost: `$${item.ProjectScores.ProjectedCost}`,
            safety: item.ProjectScores.Safety,
            compliance: item.ProjectScores.Compliance,
            environmental: item.ProjectScores.Environmental,
            efficiency: item.ProjectScores.Efficiency,
            innovation: item.ProjectScores.Innovation,
          },
        }));

        setSuggestions(mappedSuggestions);
      } catch (err) {
        console.error("Failed to fetch project suggestions:", err);
      }
    };

    fetchSuggestions();
  }, []);

  const exportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      suggestions.map(({ scores, ...rest }) => ({
        ...rest,
        ...scores,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suggestions");
    XLSX.writeFile(workbook, "suggestions.csv");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      suggestions.map(({ scores, ...rest }) => ({
        ...rest,
        ...scores,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suggestions");
    XLSX.writeFile(workbook, "suggestions.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [
        [
          "No",
          "Work Name",
          "Estimated Cost",
          "Projected Cost",
          "Safety",
          "Compliance",
          "Environmental",
          "Efficiency",
          "Innovation",
        ],
      ],
      body: suggestions.map((s, i) => [
        i + 1,
        s.workName,
        s.estimatedCost,
        s.scores.projectedCost,
        s.scores.safety,
        s.scores.compliance,
        s.scores.environmental,
        s.scores.efficiency,
        s.scores.innovation,
      ]),
    });
    doc.save("suggestions.pdf");
  };

  const exportDoc = () => {
    const text = suggestions
      .map(
        (s, i) =>
          `#${i + 1} - ${s.workName}\nEstimated: ${
            s.estimatedCost
          }\nScores: ${JSON.stringify(s.scores)}\n`
      )
      .join("\n\n");
    const blob = new Blob([text], { type: "application/msword" });
    saveAs(blob, "suggestions.doc");
  };

  const exportPPT = () => {
    const text = suggestions
      .map((s, i) => `Slide ${i + 1}: ${s.workName} (${s.estimatedCost})`)
      .join("\n");
    const blob = new Blob([text], { type: "application/vnd.ms-powerpoint" });
    saveAs(blob, "suggestions.ppt");
  };

  const handleApprove = async (id: number) => {
    await fetch(`/api/suggestions/${id}/approve`, { method: "POST" });
    setDecisions((prev) => ({ ...prev, [id]: "approved" }));
  };

  const handleReject = async (id: number) => {
    await fetch(`/api/suggestions/${id}/reject`, { method: "POST" });
    setDecisions((prev) => ({ ...prev, [id]: "rejected" }));
  };

  const handleAddSuggestion = async () => {
    const newSuggestion: Suggestion = {
      id: Date.now(),

      workName,
      estimatedCost,
      scores: {
        projectedCost: "0", // Always zero
        safety: 0,
        compliance: 0,
        environmental: 0,
        efficiency: 0,
        innovation: 0,
      },
    };

    const updatedSuggestions = [newSuggestion, ...suggestions];
    setSuggestions(updatedSuggestions);

    // Prepare POST payload
    const payload = {
      WorkName: newSuggestion.workName,
      EstimatedCost:
        parseFloat(newSuggestion.estimatedCost.replace("$", "")) || 0,
      ProjectScores: {
        ProjectedCost: 0,
        Safety: 0,
        Compliance: 0,
        Environmental: 0,
        Efficiency: 0,
        Innovation: 0,
      },
    };

    try {
      await fetch(
        "https://suggestionportal100-sandbox.mxapps.io/rest/myservice/v1/project",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([payload]), // Send as array
        }
      );
      console.log("Suggestion submitted successfully");
    } catch (error) {
      console.error("Failed to submit suggestion", error);
    }

    // Clear form and close modal
    setWorkName("");
    setEstimatedCost("");
    setModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Suggestion Request
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Suggestion Portal</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {[
                  "No",
                  "Work Name",
                  "Estimated Cost",
                  "Suggestion",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suggestions.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.workName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.estimatedCost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm mb-2">
                      <strong>Projected Cost:</strong>{" "}
                      {item.scores.projectedCost}
                    </div>
                    {[
                      "Safety",
                      "Compliance",
                      "Environmental",
                      "Efficiency",
                      "Innovation",
                    ].map((key) => (
                      <ScoreBar
                        key={key}
                        label={key}
                        value={(item.scores as any)[key.toLowerCase()]}
                      />
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {decisions[item.id] === "approved" ? (
                        <>
                          <span className="text-green-700 font-semibold">
                            Approved
                          </span>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Want to change your decision?
                          </button>
                        </>
                      ) : decisions[item.id] === "rejected" ? (
                        <>
                          <span className="text-red-700 font-semibold">
                            Rejected
                          </span>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="text-sm text-green-600 hover:underline"
                          >
                            Want to change your decision?
                          </button>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
          <div className="bg-white p-6 rounded shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
              New Suggestion Request
            </h2>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Work Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={workName}
                onChange={(e) => setWorkName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Estimated Cost</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSuggestion}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Get Suggestion
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group inline-block">
          <button className="bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg hover:bg-purple-800">
            Submit & Generate Report
          </button>

          <div className="absolute hidden group-hover:flex flex-col bg-white shadow-md rounded mb-2 w-48 right-0 bottom-full z-10">
            {[
              { label: "CSV", action: exportCSV },
              { label: "Excel", action: exportExcel },
              { label: "PDF", action: exportPDF },
              { label: "PPT", action: exportPPT },
              { label: "DOC", action: exportDoc },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestion;
