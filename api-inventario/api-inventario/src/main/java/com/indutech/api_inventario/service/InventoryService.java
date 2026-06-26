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

        double tiempoCicloDias = ((double) epq / req.demandaAnual) * req.diasOperativos;
        double tiempoProduccionDias = ((double) epq / req.tasaProduccion) * req.diasOperativos;

        double demandaDiaria = req.demandaAnual / req.diasOperativos;
        int ss = (int) Math.round(req.z * (demandaDiaria * req.desviacion));
        int rop = (int) Math.round((demandaDiaria * req.tiempoEntrega) + ss);

        return new InventoryResponse(epq, ss, rop, inventarioMaximo, tiempoCicloDias, tiempoProduccionDias);
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
                porcentajeAcumulado += res.porcentaje;
            }

            if (porcentajeAcumulado <= 80) res.clase = "A";
            else if (porcentajeAcumulado <= 95) res.clase = "B";
            else res.clase = "C";

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
}