package com.indutech.api_inventario.controller;

import com.indutech.api_inventario.dto.AbcResponseDTO;
import com.indutech.api_inventario.dto.InventoryResponse;
import com.indutech.api_inventario.dto.InventoryRequest;
import com.indutech.api_inventario.dto.ItemDTO;
import com.indutech.api_inventario.entity.Producto;
import com.indutech.api_inventario.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/calculate")
    public InventoryResponse calculate(@RequestBody InventoryRequest request) {
        return inventoryService.calcularMetricas(request);
    }

    @PostMapping("/abc")
    public List<AbcResponseDTO> calcularABC(@RequestBody List<ItemDTO> inventario) {
        return inventoryService.clasificarABC(inventario);
    }

    @PostMapping("/add")
    public void addProducto(@RequestBody List<ItemDTO> items) {
        for (ItemDTO item : items) {
            inventoryService.agregarProducto(item);
        }
    }
    @GetMapping("/all")
    public List<Producto> getAllProductos() {
        return inventoryService.obtenerTodosLosProductos();
    }

    @DeleteMapping("/delete/{sku}")
    public void deleteProducto(@PathVariable String sku) {
        inventoryService.eliminarProducto(sku);
    }

    @PutMapping("/update/{sku}")
    public void updateProducto(@PathVariable String sku, @RequestBody ItemDTO item) {
        inventoryService.actualizarProducto(sku, item);
    }
}