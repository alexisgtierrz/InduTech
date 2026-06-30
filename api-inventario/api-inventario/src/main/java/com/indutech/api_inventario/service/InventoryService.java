package com.indutech.api_inventario.service;

import com.indutech.api_inventario.dto.AbcResponseDTO;
import com.indutech.api_inventario.dto.EscenarioPedidoDTO;
import com.indutech.api_inventario.dto.ItemDTO;
import com.indutech.api_inventario.dto.InventoryRequest;
import com.indutech.api_inventario.dto.InventoryResponse;
import com.indutech.api_inventario.entity.Producto;
import com.indutech.api_inventario.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class InventoryService {

    private final ProductoRepository productoRepository;

    public InventoryService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public InventoryResponse calcularMetricas(InventoryRequest req) {
        double numerador = 2 * req.demandaAnual * req.costoPreparacion;
        double denominador = req.costoMantenimiento * (1 - (req.demandaAnual / req.tasaProduccion));
        int epq = (int) Math.round(Math.sqrt(numerador / denominador));

        int inventarioMaximo = (int) Math.round(epq * (1 - (req.demandaAnual / req.tasaProduccion)));

        int tiempoCicloDias = (int) Math.round(((double) epq / req.demandaAnual) * req.diasOperativos);
        int tiempoProduccionDias = (int) Math.round(((double) epq / req.tasaProduccion) * req.diasOperativos);

        double demandaDiaria = req.demandaAnual / req.diasOperativos;

        double probabilidad = req.nivelServicio / 100.0;

        double z = calcularZ(probabilidad);

        double ssExacto = z * req.desviacion * Math.sqrt(req.tiempoEntrega);

        int ss = (int) Math.round(ssExacto);

        int rop = (int) Math.round((demandaDiaria * req.tiempoEntrega) + ssExacto);

        double sigmaL = req.desviacion * Math.sqrt(req.tiempoEntrega);
        double faltanteEsperadoPorCiclo = calcularFaltanteEsperado(sigmaL, z);
        double probabilidadFaltantePorCiclo = 1.0 - probabilidad;

        double numeroPedidosActual = epq > 0 ? req.demandaAnual / epq : 0;
        EscenarioPedidoDTO escenarioActual = new EscenarioPedidoDTO(
                numeroPedidosActual, epq, faltanteEsperadoPorCiclo, probabilidadFaltantePorCiclo);

        double pedidosComparacion = req.pedidosComparacion > 0 ? req.pedidosComparacion : 2;
        double loteParaComparacion = req.demandaAnual / pedidosComparacion;
        EscenarioPedidoDTO escenarioComparacion = new EscenarioPedidoDTO(
                pedidosComparacion, loteParaComparacion, faltanteEsperadoPorCiclo, probabilidadFaltantePorCiclo);

        InventoryResponse response = new InventoryResponse(epq, ss, rop, inventarioMaximo, tiempoCicloDias, tiempoProduccionDias);
        response.escenarioActual = escenarioActual;
        response.escenarioComparacion = escenarioComparacion;

        return response;
    }

    /**
     * Faltante esperado por ciclo (en unidades), usando la función de pérdida normal estándar:
     * E[faltante] = sigma_L * ( phi(z) - z * (1 - Phi(z)) )
     * donde phi es la densidad normal estándar y Phi(z) es la probabilidad acumulada (nivel de servicio).
     */
    private double calcularFaltanteEsperado(double sigmaL, double z) {
        if (sigmaL <= 0) return 0;
        double phi = Math.exp(-(z * z) / 2.0) / Math.sqrt(2 * Math.PI);
        double unitNormalLoss = phi - z * (1.0 - acumuladaNormal(z));
        return sigmaL * Math.max(unitNormalLoss, 0);
    }

    /**
     * Aproximación de la función de distribución acumulada normal estándar Phi(z),
     * usada para obtener Phi(z) a partir de z (proceso inverso al de calcularZ).
     */
    private double acumuladaNormal(double z) {
        double t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
        double d = 0.3989423 * Math.exp(-z * z / 2.0);
        double prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return z >= 0 ? 1.0 - prob : prob;
    }

    private double calcularZ(double p) {
        if (p >= 0.9999) return 3.99;
        if (p <= 0.5) return 0.0;

        double t = Math.sqrt(-2.0 * Math.log(1.0 - p));
        double c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
        double d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;

        return t - ((c2 * t + c1) * t + c0) / (((d3 * t + d2) * t + d1) * t + 1.0);
    }

    public List<AbcResponseDTO> clasificarABC(List<ItemDTO> inventario, double limiteA, double limiteB) {
        List<AbcResponseDTO> resultados = new ArrayList<>();
        double valorTotal = 0;

        for (ItemDTO dto : inventario) {
            AbcResponseDTO res = new AbcResponseDTO();
            res.sku = dto.sku;
            res.demanda = dto.demanda;
            res.costo = dto.costo;
            res.valorAnual = dto.demanda * dto.costo;
            valorTotal += res.valorAnual;
            resultados.add(res);
        }

        resultados.sort((a, b) -> Double.compare(b.valorAnual, a.valorAnual));

        double porcentajeAcumulado = 0;

        for (AbcResponseDTO res : resultados) {
            if (valorTotal > 0) {
                res.porcentaje = (res.valorAnual / valorTotal) * 100;
            } else {
                res.porcentaje = 0;
            }

            double acumuladoConEsteItem = porcentajeAcumulado + res.porcentaje;

            // Aquí aplicamos los límites dinámicos que elige el usuario
            if (porcentajeAcumulado == 0 || acumuladoConEsteItem <= limiteA) {
                res.clase = "A";
            } else if (acumuladoConEsteItem <= limiteB) {
                res.clase = "B";
            } else {
                res.clase = "C";
            }

            porcentajeAcumulado = acumuladoConEsteItem;

            res.porcentaje = Math.round(res.porcentaje * 100.0) / 100.0;
        }

        return resultados;
    }


    public List<Producto> obtenerTodosLosProductos() {
        return productoRepository.findAll();
    }

    public void agregarProducto(ItemDTO dto) {
        Producto p = new Producto();
        p.setSku(dto.sku);
        p.setDemanda(dto.demanda);
        p.setCosto(dto.costo);
        productoRepository.save(p);
    }

    public void eliminarProducto(String sku) {
        productoRepository.deleteBySku(sku);
    }

    public void actualizarProducto(String skuOriginal, ItemDTO dto) {
        Producto p = productoRepository.findBySku(skuOriginal);
        if (p != null) {
            p.setSku(dto.sku);
            p.setDemanda(dto.demanda);
            p.setCosto(dto.costo);
            productoRepository.save(p);
        }
    }
}