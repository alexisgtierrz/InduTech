package com.indutech.api_inventario.repository;

import com.indutech.api_inventario.entity.Producto;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    @Transactional
    void deleteBySku(String sku);

    Producto findBySku(String sku);
}
