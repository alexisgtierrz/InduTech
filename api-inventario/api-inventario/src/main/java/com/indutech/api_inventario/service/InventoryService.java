package com.indutech.api_inventario.service;

import com.indutech.api_inventario.dto.AbcResponseDTO;
import com.indutech.api_inventario.dto.ItemDTO;
import com.indutech.api_inventario.dto.InventoryRequest;
import com.indutech.api_inventario.dto.InventoryResponse;
import com.indutech.api_inventario.entity.Producto;
import com.indutech.api_inventario.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

        return new InventoryResponse(epq, ss, rop, inventarioMaximo, tiempoCicloDias, tiempoProduccionDias);
    }

    private double calcularZ(double p) {
        if (p >= 0.9999) return 3.99;
        if (p <= 0.5) return 0.0;

        double t = Math.sqrt(-2.0 * Math.log(1.0 - p));
        double c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
        double d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;

        return t - ((c2 * t + c1) * t + c0) / (((d3 * t + d2) * t + d1) * t + 1.0);
    }

    public List<AbcResponseDTO> clasificarABC(List<ItemDTO> inventario) {
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

            if (porcentajeAcumulado == 0 || acumuladoConEsteItem <= 80) {
                res.clase = "A";
            } else if (acumuladoConEsteItem <= 96) {
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