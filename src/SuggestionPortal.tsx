import React, { useState } from "react";

interface Suggestion {
  id: number;
  images: string[];
  files: { name: string; url: string }[];
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

const initialSuggestions: Suggestion[] = [
  {
    id: 1,
    images: ["/img1.jpg", "/img2.jpg"],
    files: [
      { name: "Plan.pdf", url: "/files/plan1.pdf" },
      { name: "Design.ppt", url: "/files/design1.ppt" },
    ],
    workName: "Tunnel Reinforcement",
    estimatedCost: "$42,000",
    scores: {
      projectedCost: "$39,000",
      safety: 87,
      compliance: 93,
      environmental: 76,
      efficiency: 84,
      innovation: 90,
    },
  },
];

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

const SuggestionPortal: React.FC = () => {
  const [suggestions, setSuggestions] =
    useState<Suggestion[]>(initialSuggestions);
  const [modalOpen, setModalOpen] = useState(false);
  const [workName, setWorkName] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [decisions, setDecisions] = useState<
    Record<number, "approved" | "rejected" | null>
  >({});

  const handleApprove = async (id: number) => {
    await fetch(`/api/suggestions/${id}/approve`, { method: "POST" });
    setDecisions((prev) => ({ ...prev, [id]: "approved" }));
  };

  const handleReject = async (id: number) => {
    await fetch(`/api/suggestions/${id}/reject`, { method: "POST" });
    setDecisions((prev) => ({ ...prev, [id]: "rejected" }));
  };

  const handleAddSuggestion = () => {
    const newSuggestion: Suggestion = {
      id: Date.now(),
      images: images.map((file) => URL.createObjectURL(file)),
      files: files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
      workName,
      estimatedCost,
      scores: {
        projectedCost: estimatedCost,
        safety: 0,
        compliance: 0,
        environmental: 0,
        efficiency: 0,
        innovation: 0,
      },
    };

    setSuggestions([newSuggestion, ...suggestions]);
    setWorkName("");
    setEstimatedCost("");
    setImages([]);
    setFiles([]);
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
                  "Image",
                  "Files",
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
                  <td className="px-6 py-4 whitespace-nowrap relative group">
                    <img
                      src={item.images[0]}
                      className="w-16 h-16 object-cover rounded cursor-pointer"
                      alt="Suggestion"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap relative group">
                    <span className="underline text-blue-600 cursor-pointer">
                      View Files
                    </span>
                    <div className="absolute z-10 hidden group-hover:block bg-white p-2 shadow-lg rounded-lg top-full left-0 w-48">
                      {item.files.map((file, i) => (
                        <a
                          key={i}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-blue-600 hover:underline mb-1"
                        >
                          {file.name}
                        </a>
                      ))}
                    </div>
                  </td>
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

      {/* Modal */}
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

            <div className="mb-4">
              <label className="block mb-1 font-medium">Upload Images</label>
              <label className="block w-full cursor-pointer bg-blue-50 border border-blue-300 text-blue-700 rounded px-3 py-2 hover:bg-blue-100">
                Select Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImages(Array.from(e.target.files || []))}
                />
              </label>
              <div className="text-sm text-gray-500 mt-1">
                {images.length > 0
                  ? `${images.length} file(s) selected`
                  : "No files selected"}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Upload Files</label>
              <label className="block w-full cursor-pointer bg-blue-50 border border-blue-300 text-blue-700 rounded px-3 py-2 hover:bg-blue-100">
                Select Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </label>
              <div className="text-sm text-gray-500 mt-1">
                {files.length > 0
                  ? `${files.length} file(s) selected`
                  : "No files selected"}
              </div>
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
    </div>
  );
};

export default SuggestionPortal;
