import api from "./api";

export const apiServices = {
  // Salva o romaneio completo (usado no painel)
  saveReturnManifest: async (manifestData: any) => {
    try {
      const response = await api.post('/returns/manifest', manifestData);
      return response.data;
    } catch (error) {
      console.error("Erro ao salvar romaneio de devolução:", error);
      throw error;
    }
  },

  // Busca o manifesto pelo código (usado no PC e na Coletora)
  getManifestByCode: async (manifestCode: string) => {
    try {
      const response = await api.get(`/returns/manifest/${manifestCode}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar manifesto:", error);
      throw error;
    }
  },

  // Salva o manifesto no backend
  saveManifestBackend: async (manifestData: any) => {
    try {
      const response = await api.post('/returns/manifest/update', manifestData);
      return response.data;
    } catch (error) {
      console.error("Erro ao salvar manifesto:", error);
      throw error;
    }
  },

 
  createProvisoryManifest: async (data: { manifestCode: string, volumes: any[] }) => {
    const response = await api.post('/returns/provisory-manifest', data);
    return response.data;
  },
  createReceiving: async (data: { receivingCode: string, volumes: any[] }) => {
    try {
      const response = await api.post('/receiving/create', data);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar recebimento:", error);
      throw error;
    }
  },

    // Busca os itens da NF para conferência
  getInvoiceForScanning: async (invoiceNumber: string) => {
    const response = await api.get(`/receiving/scan-invoice/${invoiceNumber}`);
    return response.data;
  },

  // Bipa o item (EAN)
  scanItem: async (invoiceNumber: string, eanCode: string) => {
    const response = await api.post(`/receiving/scan-item/${invoiceNumber}`, { eanCode });
    return response.data;
  },

};